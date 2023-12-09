// This is a copy of our app.ts in our 461phase2 folder for unit testing purposes, 
// please look at the ./461Phase2/app.ts for the real file
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const yauzl = require('yauzl');
// import AWS from 'aws-sdk';
const cors = require('cors');
import { logger, time } from './461Phase2/logger';
import * as rds_configurator from './461Phase2/rds_config';
import * as rds_handler from './461Phase2/rds_packages';
import * as fsExtra from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import {
  upload_package,
  download_package,
  clear_s3_bucket,
} from './461Phase2/s3_packages';
import {get_metric_info, cloneRepo, check_npm_for_open_source, get_github_info, get_npm_package_name, zipDirectory} from './461Phase2/src/assets/metrics';
import { 
  Package,
  PackageMetadata,
  PackageData,
  generate_id,
} from './461Phase2/package_objs';

const app = express();
const port = process.env.PORT||8080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

function extractRepoUrl(zipFilePath: string, packageName: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    yauzl.open(zipFilePath, { lazyEntries: true }, (err: Error | null, zipfile: any | null) => {
      if (err || !zipfile) {
        reject(err || new Error('Unable to open zip file'));
        return "Unable to open zip file";
      }

      zipfile.on('entry', async (entry: any) => {
        if (/\/package\.json$/.test(entry.fileName)) {
          zipfile.openReadStream(entry, (err: Error | null, readStream: NodeJS.ReadableStream | null) => {
            if (err || !readStream) {
              reject(err || new Error('Unable to read package.json'));
              return "Unable to read package.json";
            }

            let fileContent = '';
            readStream.on('data', (data: Buffer) => {
              fileContent += data;
            });

            readStream.on('end', () => {
              try {
                const jsonObject = JSON.parse(fileContent);
                if ('repository' in jsonObject && 'url' in jsonObject.repository) {
                  resolve(jsonObject.repository.url);
                } else {
                  reject(new Error('Repository URL not found in package.json'));
                }
              } catch (parseError) {
                reject(new Error('Error parsing package.json'));
              }
            });
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        reject(new Error('Package.json not found in the zip'));
      });

      zipfile.readEntry();
    });
  });
}


//TODO: if RDS succeeds to upload but S3 fails, remove the corresponding RDS entry
app.post('/package', upload.single('file'), async (req : any, res : any) => {
  // NPM ingest
  if(req.body.URL && !req.body.Content) {
    try {
      await time.info("Starting time")
      await logger.info('Attempting to ingest package')

      let url = req.body.URL;

      await logger.info(`package url: ${req.body.URL}`);
      await logger.info(`req: ${JSON.stringify(req.body)}`);

      if(url.includes("github")) {
        const parts = url.split('/');
        const repositoryName = parts[parts.length - 1];
        // Constructing the npm package URL
        url = `https://www.npmjs.com/package/${repositoryName}`;
        await logger.info(`constructed npm package url: ${url}`);
      }

      const npmPackageName: string = get_npm_package_name(url);
      await logger.info(`package name: ${npmPackageName}`);

      const output = execSync(`npm view ${npmPackageName} --json --silent`, { encoding: 'utf8' }); // shell cmd to get json
      fs.writeFileSync(`./temp_npm_json/${npmPackageName}_info.json`, output); // write json to file
      await logger.info(`wrote json file`);
      const file = `./temp_npm_json/${npmPackageName}_info.json`; // file path
      const gitUrl:string = await check_npm_for_open_source(file);
      await logger.info(`gitUrl: ${gitUrl}`);
      let destinationPath = 'temp_linter_test';
      const cloneRepoOut = await cloneRepo(gitUrl, destinationPath);
      await logger.info(`finished cloning`);
      const zipFilePath = await zipDirectory(cloneRepoOut[1], `./tempZip.zip`);

      let username: string = ""; 
      let repo: string = ""; 
      const gitInfo = get_github_info(gitUrl);
      username = gitInfo.username;
      repo = gitInfo.repo;
      await logger.info(`username and repo found successfully: ${username}, ${repo}`);
      let gitDetails = [{username: username, repo: repo}];
      let scores = await get_metric_info(gitDetails);
      await logger.info(`retrieved scores from score calculator: ${scores.busFactor}, ${scores.rampup}, ${scores.license}, ${scores.correctness}, ${scores.maintainer}, ${scores.pullRequest}, ${scores.pinning}, ${scores.score}`);
      
      // We check if the rating is sufficient and return if it is not
      if(scores.score < 0.5) {
        logger.info(`Upload aborted, insufficient rating of ${scores.score}`);
        time.info('Aborted at this time\n');
        res.status(424).send("Package is not uploaded due to the disqualified rating.");
      }

      // Now we start the upload
      //TODO: add in the support for different versions
      const package_version = "0.0.0" //for now 
      const metadata: PackageMetadata = {
        name: npmPackageName,
        version: package_version,
        ID: generate_id(npmPackageName, package_version)
      }

      const package_id = await rds_handler.add_rds_package_data(metadata, scores);

      // Check to see if package metadata was upladed to RDS
      if (package_id === null) { //  happens when package exists already
        await logger.error("Could not upload package data to RDS")
        await time.error('Error occurred at this time\n');
        return res.status(409).send('Package exists already.');
      }
      await logger.debug(`ingest package to rds with id: ${package_id}`)

      // Upload the actual package to s3
      // Read the zipped file content
      const zippedFileContent = fs.readFileSync(zipFilePath);
      await logger.debug(`got zipped file content`)

      // Create Express.Multer.File object
      const zippedFile = {
          fieldname: 'file',
          originalname: 'zipped_directory.zip',
          encoding: '7bit',
          mimetype: 'application/zip',
          buffer: zippedFileContent // Buffer of the zipped file content
      };

      const s3_response = await upload_package(package_id, zippedFile); // Call your S3 upload function here\

      // Check to see if package data was uploaded to S3
      if (s3_response === null) {
        await logger.error("Error uploading package to S3")
        await time.error('Error occurred at this time\n');
        return res.status(400).send('Could not add package data');
      }

      // If you get to this point, the file has been successfully uploaded
      await logger.info(`Successfully uploaded package with id: ${package_id}`)
      await fsExtra.remove(cloneRepoOut[1]);
      await logger.debug(`removed clone repo`)
      await time.info("Finished at this time\n")

      let response: Package = {
        metadata: metadata,
        data: {
          content: zippedFile.buffer,
          JSProgram: "Not Implementing",
        },
      }
      
      // Old return value
      //{"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": zippedFile.buffer, "JSProgram": "Not Implementing"}};
      
      res.status(201).json(response);
    } catch (error) {
      await logger.error('Could not ingest package', error);
      await time.error('Error occurred at this time\n')
      res.status(500).send('An error occurred.');
    }

    // zip file
  } else if(!req.body.URL && req.body.Content) {
    try {
      await time.info("Starting time")
      await logger.info('Attempting to upload package')

      let packageName = "testFile";

      const binaryData = Buffer.from(req.body.Content, 'base64');
      await logger.info(`Got buffer/binary data`);
      const uploadDir = './uploads';

      // Create the uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
        await logger.info(`created upload directory`);
      } else {
        await logger.info(`upload directory exists already, no need to make it`);
      }

      const timestamp = Date.now(); // Use a timestamp to create a unique file name
      const zipFilePath = path.join(uploadDir, `file_${timestamp}.zip`);
      await logger.info(`Got zip file path: ${zipFilePath}`);

      // Create a writable stream to save the zip data
      const writeStream = fs.createWriteStream(zipFilePath);
      writeStream.write(binaryData, async (err: any) => {
        if (err) {
          await logger.info(`failed to save zip file`);
        } else {
          await logger.info(`zip file saved successfully`);
          
          // Open the zip file and read its entries here, after it's fully written
          /*yauzl.open(zipFilePath, { lazyEntries: true }, async (err: any, zipfile: any) => {
            if (err) {
              await logger.info(`error: ${err}`);
            }
          
            zipfile.readEntry();
            zipfile.on('entry', async (entry: any) => {
              await logger.info(`here!`);
            });
          });*/
          const repoUrl = await extractRepoUrl(zipFilePath, packageName);
          await logger.info(`retrieved repo url: ${repoUrl}`);
          let username: string = ""; 
          let repo: string = ""; 
          const regex = /\/([^\/]+)\/([^\/]+)\.git$/;
          const matches = repoUrl.match(regex);
          if (matches) {
            username = matches[1]; 
            repo = matches[2]; 
          }
          await logger.info(`username and repo found successfully: ${username}, ${repo}`);
          let gitDetails = [{username: username, repo: repo}];
          let scores = await get_metric_info(gitDetails);
          await logger.info(`retrieved scores from score calculator: ${scores.busFactor}, ${scores.rampup}, ${scores.license}, ${scores.correctness}, ${scores.maintainer}, ${scores.pullRequest}, ${scores.pinning}, ${scores.score}`);

          fs.unlinkSync(zipFilePath);

          // Currently using the repo name as the package name, not the zip file name
          //const name = req.file.originalname.replace(/\.zip$/, '');
          const version = "0.0.0"
          const metadata: PackageMetadata = {
            name: repo,
            version: version,
            ID: generate_id(repo, version),
          }

          const package_id = await rds_handler.add_rds_package_data(metadata, scores);

          // Check to see if package metadata was upladed to RDS
          if (package_id === null) { //  happens when package exists already
            await logger.error("Could not upload package data to RDS")
            await time.error('Error occurred at this time\n');
            return res.status(409).send('Package exists already.');
          }
          await logger.debug(`Uploaded package to rds with id: ${package_id}`)

          // Upload the actual package to s3
          const file = {buffer: binaryData}
          const s3_response = await upload_package(package_id, file);

          // Check to see if package data was uploaded to S3
          if (s3_response === null) {
            await logger.error("Error uploading package to S3")
            await time.error('Error occurred at this time\n');
            return res.status(400).send('Could not add package data');
          }

          await logger.info(`Successfully uploaded package with id: ${package_id}`)
          await time.info("Finished at this time\n")

          // Original response
          //let response = {"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": req.file.buffer, "JSProgram": "Not Implementing"}};
          
          //New response
          let response: Package = {
            metadata: metadata,
            data: {
              content: String(binaryData),
              JSProgram: "Not Implementing",
            },
          }

          res.status(201).json(response)
        }
        writeStream.end();
      });
    } catch (error) {
      await logger.error('Could not upload package', error);
      await time.error('Error occurred at this time\n')
      res.status(500).send('An error occurred.');
    }
  } else {
    // Impropper request
    res.status(400).send("There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.")
  }
});

app.get('/package/:packageId/rate', async (req : any, res : any) => {
  try {
    await time.info("Starting time")
    await logger.info("Attempring to get package rating")

    const package_id = parseInt(req.params.packageId);
    await logger.debug(`Attempting to rate package with id: ${package_id}`)

    const package_data = await rds_handler.get_package_data(package_id);
    if (package_data === null) {
      await logger.error(`No package found with id: ${package_id}`)
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package not found' });
    }

    const scores = package_data.rating;
    
    if (!scores) {
      await logger.error(`No rate data found for package with id: ${package_id}`)
      await time.error('Error occurred at this time\n');
      return res.status(404).send('Rate data not found.');
    }

    await logger.info(`Rate data found for package with id: ${package_id}, rateData: ${scores.busFactor}, ${scores.rampup}, ${scores.license}, ${scores.correctness}, ${scores.maintainer}, ${scores.pullRequest}, ${scores.pinning}, ${scores.score}`);
    await time.info("Finished at this time\n")
    res.status(200).json(scores);
  } catch (error) {
    await logger.error('Error rating package:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

app.get('/download/:packageId', async (req : any, res : any) => {
  try {
    await time.info("Starting time")
    await logger.info("Attempting to download package")

    const package_id = parseInt(req.params.packageId);

    const package_data = await rds_handler.get_package_data(package_id)
    if (package_data === null) {
      await logger.error(`No package found with id: ${package_id}`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package not found' });
    }

    await logger.debug(`Package data found for package with id: ${package_id}`);
    const package_name = package_data.name;

    const package_buffer = await download_package(package_id);
    if (package_buffer === null) {
      await logger.error(`Package with id: ${package_id} not found in S3`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package file not found' });
    }

    res.attachment(package_name + '.zip'); // Set the desired new file name here
    res.setHeader('Content-Type', 'application/zip');

    await logger.info(`Successfully downloaded package with id ${package_id}`)
    await time.info("Finished at this time\n")
    res.status(200).send(package_buffer);
    } catch (error) {
    await logger.error('Error downloading package:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

app.post('/packages', async (req : any, res : any) => {
  try {
    await time.info("Starting time")
    await logger.info("Attempting to get packages (/packages)")

    const packageName = req.body[0].Name;
    const version = req.body[0].Version;
    await logger.info(`Length of req body: ${req.body.length}`);
    await logger.info(`Got req.body.Name:${req.body[0].Name}, req.body.Version:${req.body[0].Version}`);
    if (!packageName && !version) {
      await logger.error('No name was given');
      await time.error('Error occurred at this time\n');
      return res.status(400).send('There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
    } else if (!packageName && version) {
      return res.status(501).send('This system does not support versions.');
    }

    let offsetValue;
    if (req.query.offset !== undefined) {
      offsetValue = parseInt(req.query.offset);
      await logger.info(`Offset: ${offsetValue}`);
    } else {
      offsetValue = 0;
      await logger.info('Offset is not provided in the query parameters');
    }

    let searchResults;
    if(packageName == "*") {
      searchResults = await rds_handler.match_rds_rows_with_pagination(`.*`, false, offsetValue);
    } else {
      searchResults = await rds_handler.match_rds_rows_with_pagination(`${packageName}`, true, offsetValue);
    }
    const package_names = searchResults.map((data:any) => data.package_name);

    await logger.info(`Successfully got packages (/packages)`)
    await time.info("Finished at this time\n")
    res.status(200).json(package_names);
  } catch (error) {
    await logger.error('Error searching packages:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

// Sends the a list of package names that match the regex
app.post('/package/byRegEx', async (req : any, res : any) => {
  try {
    await time.info("Starting time")
    await logger.info("Attempting to search packages")

    const searchString = req.body.RegEx as string;
    if (!searchString) {
      await logger.error('No search string was given');
      await time.error('Error occurred at this time\n');
      return res.status(400).send('Search string is required.');
    }

    // const searchResults = packages.filter((pkg) => {
    //   const regex = new RegExp(searchString, 'i');
    //   return regex.test(pkg) || regex.test(pkg + '.readme');
    // });

    const searchResults = await rds_handler.match_rds_rows(searchString);
    const package_names = searchResults.map((data : any) => ({
        Version: data.version,
        Name: data.name,
    }));

    if (package_names.length === 0) {
      await logger.error(`No packages found that match ${searchString}`);
      await time.error('Finished at this time\n');
      return res.status(404).send("No package found under this regex")
    }

    await logger.info(`Successfully searched packages`)
    await time.info("Finished at this time\n")
    res.status(200).json(package_names);
  } catch (error) {
    await logger.error('Error searching packages:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

// Resets RDS and S3
app.delete('/reset', async (req : any, res : any) => {
  try {
    await time.info("Starting time")
    await logger.info("Attempting to reset system")

    await clear_s3_bucket();
    await rds_configurator.drop_package_data_table();
    await rds_configurator.setup_rds_tables();

    await logger.info('Successfully cleared Databses and reset to original state');
    await time.info("Finished at this time\n")
    res.status(200).send('Registry is reset.');
  } catch (error) {
    await logger.error('Error resetting system:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred while resetting the registry');
  }
});

app.get('/packageId/:packageName', async (req : any, res : any) => {
  try {
    await time.info("Starting time");
    await logger.info("Attempting to get package ID by name");

    const packageName = req.params.packageName;

    const searchResults = await rds_handler.match_rds_rows(packageName);

    if (!searchResults) {
      await logger.error(`No package found with name: ${packageName}`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package not found' });
    }

    const package_id = searchResults.map((data : any) => data.package_id);

    await logger.debug(`Package ID found for package '${packageName}': ${package_id}`);
    await time.info("Finished at this time\n");

    res.status(200).json({ package_id });
  } catch (error) {
    await logger.error('Error getting package ID by name:', error);
    await time.error('Error occurred at this time\n');
    res.status(500).send('An error occurred.');
  }
});

app.put('/authenticate', async (req : any, res : any) => {
  res.status(500).send('This system does not support authentication.');
});

app.listen(port, async () => {
  await logger.info(`Server is running on port ${port}`);
  await time.info('was the time\n')
});

export { app };