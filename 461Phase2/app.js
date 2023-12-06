"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
var express = require('express');
var multer = require('multer');
var fs = require('fs');
var yauzl = require('yauzl');
// import AWS from 'aws-sdk';
var cors = require('cors');
var logger_1 = require("./logger");
var rds_configurator = require("./rds_config");
var rds_handler = require("./rds_packages");
var fsExtra = require("fs-extra");
var child_process_1 = require("child_process");
var s3_packages_1 = require("./s3_packages");
var metrics_1 = require("./src/assets/metrics");
var package_objs_1 = require("./package_objs");
var app = express();
exports.app = app;
var port = process.env.PORT || 8080;
var upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());
function extractRepoUrl(zipFilePath, packageName) {
    var _this = this;
    return new Promise(function (resolve, reject) {
        yauzl.open(zipFilePath, { lazyEntries: true }, function (err, zipfile) {
            if (err || !zipfile) {
                reject(err || new Error('Unable to open zip file'));
                return;
            }
            zipfile.on('entry', function (entry) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (entry.fileName === "".concat(packageName, "/package.json")) {
                        zipfile.openReadStream(entry, function (err, readStream) {
                            if (err || !readStream) {
                                reject(err || new Error('Unable to read package.json'));
                                return;
                            }
                            var fileContent = '';
                            readStream.on('data', function (data) {
                                fileContent += data;
                            });
                            readStream.on('end', function () {
                                try {
                                    var jsonObject = JSON.parse(fileContent);
                                    if ('repository' in jsonObject && 'url' in jsonObject.repository) {
                                        resolve(jsonObject.repository.url);
                                    }
                                    else {
                                        reject(new Error('Repository URL not found in package.json'));
                                    }
                                }
                                catch (parseError) {
                                    reject(new Error('Error parsing package.json'));
                                }
                            });
                        });
                    }
                    else {
                        zipfile.readEntry();
                    }
                    return [2 /*return*/];
                });
            }); });
            zipfile.on('end', function () {
                reject(new Error('Package.json not found in the zip'));
            });
            zipfile.readEntry();
        });
    });
}
//TODO: if RDS succeeds to upload but S3 fails, remove the corresponding RDS entry
app.post('/package', upload.single('file'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, npmPackageName, output, file, gitUrl, destinationPath, cloneRepoOut, zipFilePath, username, repo, gitInfo, gitDetails, scores, package_version, metadata, package_id, zippedFileContent, zippedFile, s3_response, response, error_1, packageName, repoUrl, username, repo, regex, matches, gitDetails, scores, version, metadata, package_id, s3_response, response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(req.body.url && !req.file)) return [3 /*break*/, 34];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 30, , 33]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Attempting to ingest package')];
            case 3:
                _a.sent();
                url = req.body.url;
                return [4 /*yield*/, logger_1.logger.info("package url: ".concat(req.body.url))];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("req: ".concat(JSON.stringify(req.body)))];
            case 5:
                _a.sent();
                npmPackageName = (0, metrics_1.get_npm_package_name)(url);
                return [4 /*yield*/, logger_1.logger.info("package name: ".concat(npmPackageName))];
            case 6:
                _a.sent();
                output = (0, child_process_1.execSync)("npm view ".concat(npmPackageName, " --json --silent"), { encoding: 'utf8' });
                fs.writeFileSync("./temp_npm_json/".concat(npmPackageName, "_info.json"), output); // write json to file
                return [4 /*yield*/, logger_1.logger.info("wrote json file")];
            case 7:
                _a.sent();
                file = "./temp_npm_json/".concat(npmPackageName, "_info.json");
                return [4 /*yield*/, (0, metrics_1.check_npm_for_open_source)(file)];
            case 8:
                gitUrl = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("gitUrl: ".concat(gitUrl))];
            case 9:
                _a.sent();
                destinationPath = 'temp_linter_test';
                return [4 /*yield*/, (0, metrics_1.cloneRepo)(gitUrl, destinationPath)];
            case 10:
                cloneRepoOut = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("finished cloning")];
            case 11:
                _a.sent();
                return [4 /*yield*/, (0, metrics_1.zipDirectory)(cloneRepoOut[1], "./tempZip.zip")];
            case 12:
                zipFilePath = _a.sent();
                username = "";
                repo = "";
                gitInfo = (0, metrics_1.get_github_info)(gitUrl);
                username = gitInfo.username;
                repo = gitInfo.repo;
                return [4 /*yield*/, logger_1.logger.info("username and repo found successfully: ".concat(username, ", ").concat(repo))];
            case 13:
                _a.sent();
                gitDetails = [{ username: username, repo: repo }];
                return [4 /*yield*/, (0, metrics_1.get_metric_info)(gitDetails)];
            case 14:
                scores = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("retrieved scores from score calculator: ".concat(scores.busFactor, ", ").concat(scores.rampup, ", ").concat(scores.license, ", ").concat(scores.correctness, ", ").concat(scores.maintainer, ", ").concat(scores.pullRequest, ", ").concat(scores.pinning, ", ").concat(scores.score))];
            case 15:
                _a.sent();
                // We check if the rating is sufficient and return if it is not
                if (scores.score < 0.5) {
                    logger_1.logger.info("Upload aborted, insufficient rating of ".concat(scores.score));
                    logger_1.time.info('Aborted at this time\n');
                    res.status(424).send("Package is not uploaded due to the disqualified rating.");
                }
                package_version = "0.0.0" //for now 
                ;
                metadata = {
                    name: npmPackageName,
                    version: package_version,
                    ID: (0, package_objs_1.generate_id)(npmPackageName, package_version)
                };
                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores)];
            case 16:
                package_id = _a.sent();
                if (!(package_id === null)) return [3 /*break*/, 19];
                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
            case 17:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 18:
                _a.sent();
                return [2 /*return*/, res.status(409).send('Package exists already.')];
            case 19: return [4 /*yield*/, logger_1.logger.debug("ingest package to rds with id: ".concat(package_id))
                // Upload the actual package to s3
                // Read the zipped file content
            ];
            case 20:
                _a.sent();
                zippedFileContent = fs.readFileSync(zipFilePath);
                return [4 /*yield*/, logger_1.logger.debug("got zipped file content")
                    // Create Express.Multer.File object
                ];
            case 21:
                _a.sent();
                zippedFile = {
                    fieldname: 'file',
                    originalname: 'zipped_directory.zip',
                    encoding: '7bit',
                    mimetype: 'application/zip',
                    buffer: zippedFileContent // Buffer of the zipped file content
                };
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, zippedFile)];
            case 22:
                s3_response = _a.sent();
                if (!(s3_response === null)) return [3 /*break*/, 25];
                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
            case 23:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 24:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Could not add package data')];
            case 25: 
            // If you get to this point, the file has been successfully uploaded
            return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
            case 26:
                // If you get to this point, the file has been successfully uploaded
                _a.sent();
                return [4 /*yield*/, fsExtra.remove(cloneRepoOut[1])];
            case 27:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.debug("removed clone repo")];
            case 28:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 29:
                _a.sent();
                response = {
                    metadata: metadata,
                    data: {
                        content: zippedFile.buffer,
                        JSProgram: "Not Implementing",
                    },
                };
                // Old return value
                //{"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": zippedFile.buffer, "JSProgram": "Not Implementing"}};
                res.status(201).json(response);
                return [3 /*break*/, 33];
            case 30:
                error_1 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not ingest package', error_1)];
            case 31:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 32:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 33];
            case 33: return [3 /*break*/, 63];
            case 34:
                if (!(!req.body.url && req.file)) return [3 /*break*/, 62];
                _a.label = 35;
            case 35:
                _a.trys.push([35, 58, , 61]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 36:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Attempting to upload package')];
            case 37:
                _a.sent();
                if (!!req.file.originalname.endsWith('.zip')) return [3 /*break*/, 40];
                return [4 /*yield*/, logger_1.logger.error('The given file is not a zip file')];
            case 38:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 39:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Invalid file format. Please upload a zip file.')];
            case 40:
                packageName = req.file.originalname.replace(/\.zip$/, '');
                fs.writeFileSync('./uploads/' + req.file.originalname, req.file.buffer);
                return [4 /*yield*/, logger_1.logger.info('Package downloaded successfully')];
            case 41:
                _a.sent();
                return [4 /*yield*/, extractRepoUrl('./uploads/' + req.file.originalname, packageName)];
            case 42:
                repoUrl = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("retrieved repo url: ".concat(repoUrl))];
            case 43:
                _a.sent();
                username = "";
                repo = "";
                regex = /https:\/\/github\.com\/(\w+)\/(\w+)\.git/;
                matches = repoUrl.match(regex);
                if (matches) {
                    username = matches[1];
                    repo = matches[2];
                }
                return [4 /*yield*/, logger_1.logger.info("username and repo found successfully: ".concat(username, ", ").concat(repo))];
            case 44:
                _a.sent();
                gitDetails = [{ username: username, repo: repo }];
                return [4 /*yield*/, (0, metrics_1.get_metric_info)(gitDetails)];
            case 45:
                scores = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("retrieved scores from score calculator: ".concat(scores.busFactor, ", ").concat(scores.rampup, ", ").concat(scores.license, ", ").concat(scores.correctness, ", ").concat(scores.maintainer, ", ").concat(scores.pullRequest, ", ").concat(scores.pinning, ", ").concat(scores.score))];
            case 46:
                _a.sent();
                fs.unlinkSync('./uploads/' + req.file.originalname);
                version = "0.0.0";
                metadata = {
                    name: repo,
                    version: version,
                    ID: (0, package_objs_1.generate_id)(repo, version),
                };
                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores)];
            case 47:
                package_id = _a.sent();
                if (!(package_id === null)) return [3 /*break*/, 50];
                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
            case 48:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 49:
                _a.sent();
                return [2 /*return*/, res.status(409).send('Package exists already.')];
            case 50: return [4 /*yield*/, logger_1.logger.debug("Uploaded package to rds with id: ".concat(package_id))
                // Upload the actual package to s3
            ];
            case 51:
                _a.sent();
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, req.file)];
            case 52:
                s3_response = _a.sent();
                if (!(s3_response === null)) return [3 /*break*/, 55];
                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
            case 53:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 54:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Could not add package data')];
            case 55: return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
            case 56:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")
                    // Original response
                    //let response = {"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": req.file.buffer, "JSProgram": "Not Implementing"}};
                    //New response
                ];
            case 57:
                _a.sent();
                response = {
                    metadata: metadata,
                    data: {
                        content: req.file.buffer,
                        JSProgram: "Not Implementing",
                    },
                };
                res.status(201).json(response);
                return [3 /*break*/, 61];
            case 58:
                error_2 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not upload package', error_2)];
            case 59:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 60:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 61];
            case 61: return [3 /*break*/, 63];
            case 62:
                // Impropper request
                res.status(400).send("There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.");
                _a.label = 63;
            case 63: return [2 /*return*/];
        }
    });
}); });
app.get('/package/:packageId/rate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, package_data, scores, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 13, , 16]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempring to get package rating")];
            case 2:
                _a.sent();
                package_id = parseInt(req.params.packageId);
                return [4 /*yield*/, logger_1.logger.debug("Attempting to rate package with id: ".concat(package_id))];
            case 3:
                _a.sent();
                return [4 /*yield*/, rds_handler.get_package_data(package_id)];
            case 4:
                package_data = _a.sent();
                if (!(package_data === null)) return [3 /*break*/, 7];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 6:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
            case 7:
                scores = package_data.rating;
                if (!!scores) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.error("No rate data found for package with id: ".concat(package_id))];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 9:
                _a.sent();
                return [2 /*return*/, res.status(404).send('Rate data not found.')];
            case 10: return [4 /*yield*/, logger_1.logger.info("Rate data found for package with id: ".concat(package_id, ", rateData: ").concat(scores.busFactor, ", ").concat(scores.rampup, ", ").concat(scores.license, ", ").concat(scores.correctness, ", ").concat(scores.maintainer, ", ").concat(scores.pullRequest, ", ").concat(scores.pinning, ", ").concat(scores.score))];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 12:
                _a.sent();
                res.status(200).json(scores);
                return [3 /*break*/, 16];
            case 13:
                error_3 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error rating package:', error_3)];
            case 14:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 15:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
app.get('/download/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, package_data, package_name, package_buffer, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 14, , 17]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to download package")];
            case 2:
                _a.sent();
                package_id = parseInt(req.params.packageId);
                return [4 /*yield*/, rds_handler.get_package_data(package_id)];
            case 3:
                package_data = _a.sent();
                if (!(package_data === null)) return [3 /*break*/, 6];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 5:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
            case 6: return [4 /*yield*/, logger_1.logger.debug("Package data found for package with id: ".concat(package_id))];
            case 7:
                _a.sent();
                package_name = package_data.name;
                return [4 /*yield*/, (0, s3_packages_1.download_package)(package_id)];
            case 8:
                package_buffer = _a.sent();
                if (!(package_buffer === null)) return [3 /*break*/, 11];
                return [4 /*yield*/, logger_1.logger.error("Package with id: ".concat(package_id, " not found in S3"))];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 10:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package file not found' })];
            case 11:
                res.attachment(package_name + '.zip'); // Set the desired new file name here
                res.setHeader('Content-Type', 'application/zip');
                return [4 /*yield*/, logger_1.logger.info("Successfully downloaded package with id ".concat(package_id))];
            case 12:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 13:
                _a.sent();
                res.status(200).send(package_buffer);
                return [3 /*break*/, 17];
            case 14:
                error_4 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error downloading package:', error_4)];
            case 15:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 16:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 17];
            case 17: return [2 /*return*/];
        }
    });
}); });
app.post('/packages', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var packageName, version, offsetValue, searchResults, package_names, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 19, , 22]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to get packages (/packages)")];
            case 2:
                _a.sent();
                packageName = req.body[0].Name;
                version = req.body[0].Version;
                return [4 /*yield*/, logger_1.logger.info("Length of req body: ".concat(req.body.length))];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Got req.body.Name:".concat(req.body[0].Name, ", req.body.Version:").concat(req.body[0].Version))];
            case 4:
                _a.sent();
                if (!(!packageName && !version)) return [3 /*break*/, 7];
                return [4 /*yield*/, logger_1.logger.error('No name was given')];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 6:
                _a.sent();
                return [2 /*return*/, res.status(400).send('There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.')];
            case 7:
                if (!packageName && version) {
                    return [2 /*return*/, res.status(501).send('This system does not support versions.')];
                }
                _a.label = 8;
            case 8:
                offsetValue = void 0;
                if (!(req.query.offset !== undefined)) return [3 /*break*/, 10];
                offsetValue = parseInt(req.query.offset);
                return [4 /*yield*/, logger_1.logger.info("Offset: ".concat(offsetValue))];
            case 9:
                _a.sent();
                return [3 /*break*/, 12];
            case 10:
                offsetValue = 0;
                return [4 /*yield*/, logger_1.logger.info('Offset is not provided in the query parameters')];
            case 11:
                _a.sent();
                _a.label = 12;
            case 12:
                searchResults = void 0;
                if (!(packageName == "*")) return [3 /*break*/, 14];
                return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination(".*", false, offsetValue)];
            case 13:
                searchResults = _a.sent();
                return [3 /*break*/, 16];
            case 14: return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination("".concat(packageName), true, offsetValue)];
            case 15:
                searchResults = _a.sent();
                _a.label = 16;
            case 16:
                package_names = searchResults.map(function (data) { return data.package_name; });
                return [4 /*yield*/, logger_1.logger.info("Successfully got packages (/packages)")];
            case 17:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 18:
                _a.sent();
                res.status(200).json(package_names);
                return [3 /*break*/, 22];
            case 19:
                error_5 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_5)];
            case 20:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 21:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 22];
            case 22: return [2 /*return*/];
        }
    });
}); });
// Sends the a list of package names that match the regex
app.post('/package/byRegEx', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var searchString, searchResults, package_names, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 15]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to search packages")];
            case 2:
                _a.sent();
                searchString = req.body.RegEx;
                if (!!searchString) return [3 /*break*/, 5];
                return [4 /*yield*/, logger_1.logger.error('No search string was given')];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 4:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Search string is required.')];
            case 5: return [4 /*yield*/, rds_handler.match_rds_rows(searchString)];
            case 6:
                searchResults = _a.sent();
                package_names = searchResults.map(function (data) { return ({
                    Version: data.version,
                    Name: data.name,
                }); });
                if (!(package_names.length === 0)) return [3 /*break*/, 9];
                return [4 /*yield*/, logger_1.logger.error("No packages found that match ".concat(searchString))];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Finished at this time\n')];
            case 8:
                _a.sent();
                return [2 /*return*/, res.status(404).send("No package found under this regex")];
            case 9: return [4 /*yield*/, logger_1.logger.info("Successfully searched packages")];
            case 10:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 11:
                _a.sent();
                res.status(200).json(package_names);
                return [3 /*break*/, 15];
            case 12:
                error_6 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_6)];
            case 13:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 14:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); });
// Resets RDS and S3
app.delete('/reset', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 11]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to reset system")];
            case 2:
                _a.sent();
                return [4 /*yield*/, (0, s3_packages_1.clear_s3_bucket)()];
            case 3:
                _a.sent();
                return [4 /*yield*/, rds_configurator.drop_package_data_table()];
            case 4:
                _a.sent();
                return [4 /*yield*/, rds_configurator.setup_rds_tables()];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Successfully cleared Databses and reset to original state')];
            case 6:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 7:
                _a.sent();
                res.status(200).send('Registry is reset.');
                return [3 /*break*/, 11];
            case 8:
                error_7 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error resetting system:', error_7)];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 10:
                _a.sent();
                res.status(500).send('An error occurred while resetting the registry');
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.get('/packageId/:packageName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var packageName, searchResults, package_id, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 12]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to get package ID by name")];
            case 2:
                _a.sent();
                packageName = req.params.packageName;
                return [4 /*yield*/, rds_handler.match_rds_rows(packageName)];
            case 3:
                searchResults = _a.sent();
                if (!!searchResults) return [3 /*break*/, 6];
                return [4 /*yield*/, logger_1.logger.error("No package found with name: ".concat(packageName))];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 5:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
            case 6:
                package_id = searchResults.map(function (data) { return data.package_id; });
                return [4 /*yield*/, logger_1.logger.debug("Package ID found for package '".concat(packageName, "': ").concat(package_id))];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 8:
                _a.sent();
                res.status(200).json({ package_id: package_id });
                return [3 /*break*/, 12];
            case 9:
                error_8 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error getting package ID by name:', error_8)];
            case 10:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 11:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
app.put('/authenticate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.status(500).send('This system does not support authentication.');
        return [2 /*return*/];
    });
}); });
app.listen(port, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logger_1.logger.info("Server is running on port ".concat(port))];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info('was the time\n')];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
