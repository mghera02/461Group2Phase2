import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import cors from "cors";

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
}); //aws setup

app.use(cors());

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    if (!req.file.originalname.endsWith('.zip')) {
      return res.status(400).send('Invalid file format. Please upload a zip file.');
    }
    const params = {
      Bucket: 'your-s3-bucket-name',
      Key: req.file.originalname,
      Body: req.file.buffer,
    }; //aws s3 parameters

    s3.upload(params, (err, data) => {
        if (err) {
          console.error('S3 upload error:', err);
          return res.status(500).send('An error occurred while uploading the file.');
        }
        console.log('File uploaded to S3:', data.Location);
        res.status(200).send('File uploaded successfully!');
      });          
  } catch (error) {
    console.error('Diff Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/rate/:packageId', (req, res) => {
  try {
    const packageId = req.params.packageId;

    const s3Params = {
      Bucket: 'your-s3-bucket-name',
      Key: packageId + '.json', //assuming each rate data is stored as a JSON object
    };
    s3.getObject(s3Params, (err, data) => { 
      if (err) {
        console.error('S3 getObject error:', err);
        return res.status(500).send('An error occurred while fetching the rate data.');
      }
      const rateData = JSON.parse(data.Body?.toString() || '');
      if (!rateData || !rateData.rate) {
        return res.status(404).send('Rate data not found.');
      }
      res.status(200).json(rateData);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/download/:packageId', (req, res) => {
  try {
    const packageId = req.params.packageId;
    const s3Params = {
      Bucket: 'your-s3-bucket-name',
      Key: packageId + '.json',
    };
    s3.getObject(s3Params)
      .createReadStream()
      .pipe(res); //send package directly
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/packages', async (req, res) => {
  try {
    const s3Params = {
      Bucket: 'your-s3-bucket-name',
      Prefix: '', 
    };
    const s3Objects = await s3.listObjectsV2(s3Params).promise();
    const packages = s3Objects.Contents.map((object) => object.Key);
    //pagination
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    const paginatedPackages = packages.slice(startIndex, endIndex);
    res.status(200).json(paginatedPackages);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/search', async (req, res) => {
  try {
    const searchString = req.query.q;
    if (!searchString) {
      return res.status(400).send('Search string is required.');
    }
    const s3Params = {
      Bucket: 'your-s3-bucket-name',
    };
    const s3Objects = await s3.listObjectsV2(s3Params).promise();
    const packages = s3Objects.Contents.map((object) => object.Key);

    const searchResults = packages.filter((pkg) => {
      const regex = new RegExp(searchString, 'i');
      return regex.test(pkg) || regex.test(pkg + '.readme');
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.post('/reset', (req, res) => {
  try {
    const s3Params = {
      Bucket: 'your-s3-bucket-name',
    };

    s3.listObjectsV2(s3Params, (err, data) => {
      if (err) {
        console.error('Error listing objects:', err);
        return res.status(500).send('An error occurred while listing objects.');
      }
      if (data.Contents.length === 0) {
        return res.status(200).send('Registry is already empty.');
      }

      const deleteErrors = [];
      data.Contents.forEach((object) => {
        s3.deleteObject({ Bucket: 'your-s3-bucket-name', Key: object.Key }, (err) => {
          if (err) {
            console.error('Error deleting object:', err);
            deleteErrors.push(err.message);
          }
        });
      });
      if (deleteErrors.length > 0) {
        return res.status(500).json({
          message: 'Registry reset with errors',
          errors: deleteErrors,
        });
      }
      res.status(200).send('Registry reset to default state.');
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while resetting the registry.');
  }
});

app.post('/ingest', async (req, res) => {
  try {
    const packageName = req.body.packageName; 
    if (!packageName) {
      return res.status(400).send('Package name is required.');
    }
    const s3Params = {
      Bucket: 'your-s3-bucket-name',
      Key: packageName + '.json', 
    };
    s3.getObject(s3Params, (err, data) => {
      if (err) {
        console.error('S3 getObject error:', err);
        return res.status(500).send('An error occurred while fetching the rate data.');
      }
      const rateData = JSON.parse(data.Body?.toString() || '');
      if (!rateData || !rateData.rate || rateData.rate <= 0.5) {
        return res.status(400).send('Package rate is not sufficient for ingestion.');
      }
      const uploadParams = {
        Bucket: 'your-s3-bucket-name',
        Key: packageName + '.zip', 
        Body: req.file.buffer,
      };
      s3.upload(uploadParams, (uploadErr, uploadData) => {
        if (uploadErr) {
          console.error('S3 upload error:', uploadErr);
          return res.status(500).send('An error occurred while uploading the package.');
        }
        console.log('Package uploaded to S3:', uploadData.Location);
        res.status(200).send('Package ingested and uploaded successfully!');
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while trying to ingest an npm package.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
