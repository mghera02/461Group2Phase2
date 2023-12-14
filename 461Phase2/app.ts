// This is the file that contains all the code for our endpoints. 
// Any bit of code that handles the request from any of the endpoints lives here.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const yauzl = require('yauzl');
// import AWS from 'aws-sdk';
const cors = require('cors');
const safeRegex = require('safe-regex');
import { logger, time } from './logger';
import * as rds_configurator from './rds_config';
import * as rds_handler from './rds_packages';
import * as fsExtra from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import {
  upload_package,
  download_package,
  clear_s3_bucket,
  updateS3Package,
  delete_package_from_s3
} from './s3_packages';
import {get_metric_info, cloneRepo, check_npm_for_open_source, get_github_info, get_npm_package_name, zipDirectory} from './src/assets/metrics';
import { 
  Package,
  PackageMetadata,
  PackageData,
  generate_id,
} from './package_objs';

const app = express();
const port = process.env.PORT||8080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

interface RepoInfo {
  version: string,
  url: string,
}

function extractRepoInfo(zipFilePath: string): Promise<RepoInfo> {
  return new Promise(async (resolve, reject) => {
    yauzl.open(zipFilePath, { lazyEntries: true }, (err: Error | null, zipfile: any | null) => {
      if (err || !zipfile) {
        reject(err || new Error('Unable to open zip file'));
        return "Unable to open zip file";
      }

      zipfile.on('entry', async (entry: any) => {
        //await logger.info(`Entry Name: ${entry.fileName}`);
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
                if ('repository' in jsonObject && 'url' in jsonObject.repository && 'version' in jsonObject) {
                  const info : RepoInfo = {
                    version: jsonObject.version,
                    url: jsonObject.repository.url
                  }
                  resolve(info)
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
app.post('/package', upload.single('file'), async (req, res) => {
  let JSProgram = "";
  if(req.body.JSProgram) {
    JSProgram = req.body.JSProgram;
  }

  // NPM ingest
  if(req.body.URL && !req.body.Content) {
    try {
      await time.info("Starting time")
      await logger.info('Ingesting package (POST /package)')

      let url = req.body.URL;

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

      let version = "";
      fs.readFile(path.join('./src/assets/temp_linter_test', 'package.json'), 'utf8', async (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
      
        try {
          const packageJson = JSON.parse(data);
          version = packageJson.version;
          await logger.info(`version found: ${version}`);
        } catch (error) {
          await logger.info(`error searching version: ${error}`);
        }
      });

      let username: string = ""; 
      let repo: string = ""; 
      const gitInfo = get_github_info(gitUrl);
      username = gitInfo.username;
      repo = gitInfo.repo;
      await logger.info(`username and repo found successfully: ${username}, ${repo}`);
      let gitDetails = [{username: username, repo: repo}];
      let scores = await get_metric_info(gitDetails);
      //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
      await logger.info(`retrieved scores from score calculator: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
      
      // We check if the rating is sufficient and return if it is not
      if(scores.NetScore < 0.5) {
        logger.info(`Upload aborted, insufficient rating of ${scores.NetScore}`);
        time.info('Aborted at this time\n');
        res.status(424).send("Package is not uploaded due to the disqualified rating.");
      }

      // Now we start the upload
      //TODO: add in the support for different versions
      const info : RepoInfo = {
        version: version,
        url: repo
      }
      const package_version = info.version;
      const metadata: PackageMetadata = {
        Name: npmPackageName,
        Version: package_version,
        ID: generate_id(npmPackageName, package_version)
      }

      const package_id = await rds_handler.add_rds_package_data(metadata, scores, JSProgram);

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

      const base64EncodedData = (zippedFileContent).toString('base64');
      let response: Package = {
        metadata: metadata,
        data: {
          Content: base64EncodedData,
          JSProgram: JSProgram,
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
      await logger.info('Uploading package (POST /package)')

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
          const info = await extractRepoInfo(zipFilePath);
          const repoUrl = info.url;
          const version = info.version;
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
          //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
          await logger.info(`retrieved scores from score calculator: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);

          fs.unlinkSync(zipFilePath);

          // Currently using the repo name as the package name, not the zip file name
          //const name = req.file.originalname.replace(/\.zip$/, '');
          const metadata: PackageMetadata = {
            Name: repo,
            Version: version,
            ID: generate_id(repo, version),
          }

          const package_id = await rds_handler.add_rds_package_data(metadata, scores, JSProgram);

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
              Content: String(req.body.Content),
              JSProgram: JSProgram,
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

app.get('/package/:id/rate', async (req, res) => {
  try {
    await time.info("Starting time")
    await logger.info("Rating package (GET /package/:id/rate)")

    const package_id = req.params.id;
    await logger.debug(`Attempting to rate package with id: ${package_id}`)

    const scores = await rds_handler.get_package_rating(package_id);
    if (scores === null) {
      await logger.error(`No package found with id: ${package_id}`)
      await time.error('Error occurred at this time\n');
      return res.status(404).json('Package does not exist.');
    }
    await logger.info(`Received package data from RDS: ${scores}`);
    
    if (!scores) {
      await logger.error(`No rate data found for package with id: ${package_id}`)
      await time.error('Error occurred at this time\n');
      return res.status(404).send('Rate data not found.');
    }

    //await logger.debug(`Rate data found for package with id: ${package_id}, rateData: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
    await logger.info(`res: ${JSON.stringify(scores)}`);
    await time.info("Finished at this time\n")
    res.status(200).json(scores);
  } catch (error) {
    await logger.error('Error rating package:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

app.get('/package/:packageId', async (req, res) => {
  try {
    await time.info("Starting time")
    await logger.info("Downloading package (GET /package/:packageId)")

    const package_id = req.params.packageId;

    const metadata = await rds_handler.get_package_metadata(package_id)
    if (metadata === null) {
      await logger.error(`No package found with id: ${package_id}`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package metadata not found' });
    }

    await logger.debug(`Package data found for package with id: ${package_id}`);
    const package_name = metadata.name;
    const package_ID = metadata.id;
    const package_Version = metadata.version;
    const JSProgram = metadata.JSProgram;

    let data = await download_package(package_id);
    let data2 = data.Content;
    /// Extracting the Buffer data from the string
    // Convert the Buffer array to a Buffer instance

    //VERSION WITH ISSUE
    // let buffer;
    // if (typeof data2 === 'string') {
    //   buffer = Buffer.from(data2);
    //   await logger.info(`data2 is of type string, correct`);
    // } else {
    //   await logger.error(`Package content was not a string type`);
    //   await time.error('Error occurred at this time\n');
    //   return res.status(400).json({ error: 'Package content is not of \'string\' type'});
    // }

    //OLD VERSION
    const buffer = Buffer.from(data2);

    // Convert the Buffer to a Base64 encoded string
    const base64Encoded = buffer.toString('base64');
    if (data === null) {
      await logger.error(`Package with id: ${package_id} not found in S3`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package data not found' });
    }

    res.attachment(package_name + '.zip'); // Set the desired new file name here
    res.setHeader('Content-Type', 'application/zip');

    const pkg = {
      metadata: {Name: package_name, ID: package_id, Version: package_Version},
      data: {Content: base64Encoded, JSProgram: JSProgram},
    }

    await logger.info(`Successfully downloaded package with id ${package_id}`)
    await time.info("Finished at this time\n")
    res.status(200).json(pkg);
    } catch (error) {
    await logger.error('Error downloading package:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

app.post('/packages', async (req, res) => {
  try {
    await time.info("Starting time")
    await logger.info("Listing packages (POST /packages)")
    await logger.info(`req: ${JSON.stringify(req.body)}`);

    const packageName = req.body[0].Name;
    let version = req.body[0].Version;
    await logger.info(`Length of req body: ${req.body.length}`);
    await logger.info(`Got req.body.Name:${req.body[0].Name}, req.body.Version:${req.body[0].Version}`);

    await logger.info(`Version string length: ${version.length}`);
    if(version == undefined || version == null || version == "*" || version.length == 0) {
      await logger.info(`Setting version to .*`);
      version = ".*";
    }

    if (!packageName) {
      await logger.error('No name was given');
      await time.error('Error occurred at this time\n');
      return res.status(400).send('There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
    }

    // Trying to get all ranges of versions
    if(version != ".*") {
      await logger.info(`version: ${version}`)
      let rangeResults = await rds_handler.match_rds_rows(packageName);
      for (const result of rangeResults) {
        logger.info(`result version: ${result.version}`)
        const [operator, rest] = version.split(/[0-9]/);
        const rangeParts = rest.split('-');
        
        const minRange = rangeParts[0].split('.').map(Number);
        const maxRange = rangeParts[1].split('.').map(Number);

        const versionNumbers = result.version.split('.').map(Number);

        switch (operator) {
          case '^':
            if (
              versionNumbers[0] === minRange[0] &&
              versionNumbers[1] === minRange[1] &&
              versionNumbers[2] >= minRange[2] &&
              versionNumbers[2] <= minRange[2] + 4
            ) {
              version = result.version
            }
          case '~':
            if (
              versionNumbers[0] === minRange[0] &&
              versionNumbers[1] === minRange[1] &&
              versionNumbers[2] >= minRange[2] &&
              versionNumbers[2] <= minRange[2] + 1
            ) {
              version = result.version
            }
          case '-':
            if (
              versionNumbers[0] === minRange[0] &&
              versionNumbers[1] === minRange[1] &&
              versionNumbers[2] >= minRange[2] &&
              versionNumbers[0] === maxRange[0] &&
              versionNumbers[1] === maxRange[1] &&
              versionNumbers[2] <= maxRange[2]
            ) {
              version = result.version
            }
          default:
            if(version == result.version) {
              version = result.version
            }
        }
      }
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
      searchResults = await rds_handler.match_rds_rows_with_pagination(`.*`, version, false, offsetValue);
    } else {
      searchResults = await rds_handler.match_rds_rows_with_pagination(`${packageName}`, version, true, offsetValue);
    }
    const package_names = searchResults.map((data) => ({
        Version: data.version,
        Name: data.name,
        ID: data.id,
    }));

    await logger.info(`Successfully got packages (/packages): ${JSON.stringify(package_names)}`);
    await time.info("Finished at this time\n")
    res.setHeader('offset', offsetValue + 2);
    res.status(200).json(package_names);
  } catch (error) {
    await logger.error('Error searching packages:', error);
    await time.error('Error occurred at this time\n')
    res.status(500).send('An error occurred.');
  }
});

// Sends the a list of package names that match the regex
app.post('/package/byRegEx', async (req, res) => {
  const timeout = setTimeout(async () => {
    // If the endpoint takes longer than 5 sec, send an error response
    await logger.info(`Detected unsafe regex`);
    res.status(500).send('Request timeout');
  }, 5000);

  try {
    await time.info("Starting time")
    await logger.info("Searching packages (POST /package/byRegEx)")
    await logger.info(`req: ${JSON.stringify(req.body)}`);

    const searchString = req.body.RegEx as string;
    if (!searchString) {
      await logger.error('No search string was given');
      await time.error('Error occurred at this time\n');
      clearTimeout(timeout);
      return res.status(400).send('Search string is required.');
    }

    // const searchResults = packages.filter((pkg) => {
    //   const regex = new RegExp(searchString, 'i');
    //   return regex.test(pkg) || regex.test(pkg + '.readme');
    // });

    const searchResults = await rds_handler.match_rds_rows(searchString);
    const package_names = searchResults.map((data) => ({
      Version: data.version,
      Name: data.name,
    }));

    if (package_names.length === 0) {
      await logger.error(`No packages found that match ${searchString}`);
      await time.error('Finished at this time\n');
      clearTimeout(timeout);
      return res.status(404).send("No package found under this regex")
    }

    await logger.info(`Successfully searched packages`)
    await time.info("Finished at this time\n")
    clearTimeout(timeout);
    res.status(200).json(package_names);
  } catch (error) {
    await logger.error('Error searching packages:', error);
    await time.error('Error occurred at this time\n')
    clearTimeout(timeout);
    res.status(500).send('An error occurred.');
  }
});

// Resets RDS and S3
app.delete('/reset', async (req, res) => {
  try {
    await time.info("Starting time")
    await logger.info("System reset (/reset)")

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

app.get('/packageId/:packageName', async (req, res) => {
  try {
    await time.info("Starting time");
    await logger.info("Attempting to get package ID by name (GET /packageId/:packageName)");

    const packageName = req.params.packageName;

    const searchResults = await rds_handler.match_rds_rows(packageName);

    if (!searchResults) {
      await logger.error(`No package found with name: ${packageName}`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json({ error: 'Package not found' });
    }

    const package_id = searchResults.map((data) => data.id);

    await logger.debug(`Package ID found for package '${packageName}': ${package_id}`);
    await time.info("Finished at this time\n");

    res.status(200).json({ package_id });
  } catch (error) {
    await logger.error('Error getting package ID by name:', error);
    await time.error('Error occurred at this time\n');
    res.status(500).send('An error occurred.');
  }
});

app.put('/package/:id', async (req: any, res: any) => {
  try {
    await time.info("Starting time");
    await logger.info("Updating Package (PUT /package/:id)");

    const { metadata, data } = req.body;

    // Extract relevant data from the request body
    const { Name, Version, ID } = metadata;
    const { Content, URL, JSProgram } = data;
    await logger.info(`Input: ${Name}, ${Version}, ${ID}`);

    const existingPackage = await rds_handler.get_package_metadata(ID);

    if (!existingPackage) {
      await logger.error(`No package found with ID: ${ID}`);
      await time.error('Error occurred at this time\n');
      return res.status(404).json('Package does not exist.');
    }

    let rowsUpdated = await rds_handler.update_rds_package_data(ID, Name, Version);

    if(URL && !Content) {
      await logger.info(`Updating via URL`);
      let npmURL;
      if(URL.includes("github")) {
        const parts = URL.split('/');
        const repositoryName = parts[parts.length - 1];
        // Constructing the npm package URL
        npmURL = `https://www.npmjs.com/package/${repositoryName}`;
        await logger.info(`constructed npm package url: ${npmURL}`);
      }
  
      const npmPackageName: string = get_npm_package_name(String(npmURL));
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
      const s3_response = await upload_package(ID, zippedFile);
    } else if(!URL && Content) {
      await logger.info(`Updating via content`);
      const binaryData = Buffer.from(Content, 'base64');
      const file = {buffer: binaryData}
      let s3Url = await updateS3Package(ID, file);
    } else {
      return res.status(400).json('Package does not exist.');
    }

    await time.info("Finished at this time\n");

    res.status(200).send('Version is updated.');
  } catch (error) {
    await logger.error('Error updating package content:', error);
    await time.error('Error occurred at this time\n');
    res.status(500).send('An error occurred.');
  }
});

app.put('/authenticate', async (req, res) => {
  await logger.info('Request received for authentication');
  res.status(501).send('This system does not support authentication.');
});

app.delete('/package/:id', async (req, res) => {
  await time.info("Starting time")
  await logger.info("Deleting package version (delete /package/:id)")

  const package_id = req.params.id;
  await logger.debug(`Attempting to delete package with id: ${package_id}`);

  if(package_id) {
    let deletionStatus = await rds_handler.delete_rds_package_data(package_id);
    await logger.debug(`Deletion status result: ${deletionStatus}`)
    await delete_package_from_s3(package_id);

    if(deletionStatus) {
      res.status(200).send('Package is deleted.');
    } else {
      res.status(404).send('Package does not exist.');
    }
  } else {
    res.status(404).send('There is missing field(s) in the PackageID/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
  }
});

app.get('/package/byName/:name', async (req, res) => {
  await logger.info('Request received for package history');
  res.status(501).send('This system does not support package history.');
});

app.delete('/package/byName/:name', async (req, res) => {
  await logger.info('Request received for package deletion 2');
  res.status(501).send('This system does not support deletion.');
});

app.listen(port, async () => {
  await logger.info(`Server is running on port ${port}`);
  await time.info('was the time\n')
});

export { app };