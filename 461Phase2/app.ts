const express = require('express');
const multer = require('multer');
// import AWS from 'aws-sdk';
const cors = require('cors');
import { logger } from './logger';
import * as rds_configurator from './rds_config';
import * as rds_handler from './rds_packages';
import {
  upload_package,
  download_package,
  clear_s3_bucket,
} from './s3_packages';

const app = express();
const port = 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    if (!req.file.originalname.endsWith('.zip')) {
      return res.status(400).send('Invalid file format. Please upload a zip file.');
    }

    // The package name and rating may eventually change
    // Currently not doing anything with the rating JSON
    // The replace statement gets rid of .zip from the filename
    const package_id = await rds_handler.add_rds_package_data(req.file.originalname.replace(/\.zip$/, ''), {});

    // Check to see if package metadata was upladed to RDS
    if (package_id === null) {
      logger.error("Could not upload package data to RDS")
      return res.status(400).send('Could not add package metadata');
    }
    logger.debug(`Uploaded package to rds with id: ${package_id}`)

    // Upload the actual package to s3
    const s3_response = await upload_package(package_id, req.file);

    // Check to see if package data was uploaded to S3
    if (s3_response === null) {
      logger.error("Error uploading package to S3")
      return res.status(400).send('Could not add package data');
    }

    logger.info(`Successfully uploaded package with id: ${package_id}`)
    res.status(200).send("Package uploaded successfully")
  } catch (error) {
    logger.error('Could not upload package', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/rate/:packageId', async (req, res) => {
  try {
    const package_id = parseInt(req.params.packageId);
    logger.debug(`Attempting to rate package with id: ${package_id}`)

    const package_data = await rds_handler.get_package_data(package_id);
    if (package_data === null) {
      logger.error(`No package found with id: ${package_id}`)
      return res.status(404).json({ error: 'Package not found' });
    }

    const rateData = package_data.rating;
    
    if (!rateData) {
      logger.error(`No rate data found for package with id: ${package_id}`)
      return res.status(404).send('Rate data not found.');
    }

    logger.info(`Rate data found for package with id: ${package_id}, rateData: ${rateData}`)
    res.status(200).json(rateData);
  } catch (error) {
    logger.error('Error rating package:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/download/:packageId', async (req, res) => {
  try {
    const package_id = parseInt(req.params.packageId);

    const package_data = await rds_handler.get_package_data(package_id)
    if (package_data === null) {
      logger.error(`No package found with id: ${package_id}`);
      return res.status(404).json({ error: 'Package not found' });
    }

    logger.debug(`Package data found for package with id: ${package_id}`);
    const package_name = package_data.package_name;

    const package_buffer = await download_package(package_id);
    if (package_buffer === null) {
      logger.error(`Package with id: ${package_id} not found in S3`);
      return res.status(404).json({ error: 'Package file not found' });
    }

    res.attachment(package_name + '.zip'); // Set the desired new file name here
    res.setHeader('Content-Type', 'application/zip');

    logger.info(`Successfully downloaded package with id ${package_id}`)
    res.status(200).send(package_buffer);
    } catch (error) {
    logger.error('Error downloading package:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/packages', async (req, res) => {
  // try {
  //   const s3Params = {
  //     Bucket: 'your-s3-bucket-name',
  //     Prefix: '', 
  //   };
  //   const s3Objects = await s3.listObjectsV2(s3Params).promise();
  //   const packages = s3Objects.Contents.map((object) => object.Key);
  //   //pagination
  //   const page = req.query.page || 1;
  //   const perPage = req.query.perPage || 10;
  //   const startIndex = (page - 1) * perPage;
  //   const endIndex = page * perPage;
  //   const paginatedPackages = packages.slice(startIndex, endIndex);
  //   res.status(200).json(paginatedPackages);
  // } catch (error) {
  //   console.error('Error:', error);
  //   res.status(500).send('An error occurred.');
  // }
});

// Sends the a list of package names that match the regex
app.get('/search', async (req, res) => {
  try {
    const searchString = req.query.q as string;
    if (!searchString) {
      return res.status(400).send('Search string is required.');
    }

    // const searchResults = packages.filter((pkg) => {
    //   const regex = new RegExp(searchString, 'i');
    //   return regex.test(pkg) || regex.test(pkg + '.readme');
    // });

    const searchResults = await rds_handler.match_rds_rows(searchString);
    const package_names = searchResults.map((data) => data.package_name);

    logger.info(`Successfully searched packages`)
    res.status(200).json(package_names);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

// Resets RDS and S3
app.post('/reset', async (req, res) => {
  try {
    // const s3Params = {
    //   Bucket: 'your-s3-bucket-name',
    // };

    // s3.listObjectsV2(s3Params, (err, data) => {
    //   if (err) {
    //     console.error('Error listing objects:', err);
    //     return res.status(500).send('An error occurred while listing objects.');
    //   }
    //   if (data.Contents.length === 0) {
    //     return res.status(200).send('Registry is already empty.');
    //   }

    //   const deleteErrors = [];
    //   data.Contents.forEach((object) => {
    //     s3.deleteObject({ Bucket: 'your-s3-bucket-name', Key: object.Key }, (err) => {
    //       if (err) {
    //         console.error('Error deleting object:', err);
    //         deleteErrors.push(err.message);
    //       }
    //     });
    //   });
    //   if (deleteErrors.length > 0) {
    //     return res.status(500).json({
    //       message: 'Registry reset with errors',
    //       errors: deleteErrors,
    //     });
    //   }
    //   res.status(200).send('Registry reset to default state.');
    // });
    await clear_s3_bucket();
    await rds_configurator.drop_package_data_table();
    await rds_configurator.setup_rds_tables();

  } catch (error) {
    logger.error('Error clearing databases:', error);
    res.status(500).send('An error occurred while resetting the registry.');
  }
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
