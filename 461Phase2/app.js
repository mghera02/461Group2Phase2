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
// This is the file that contains all the code for our endpoints. 
// Any bit of code that handles the request from any of the endpoints lives here.
var express = require('express');
var multer = require('multer');
var fs = require('fs');
var yauzl = require('yauzl');
// import AWS from 'aws-sdk';
var cors = require('cors');
var safeRegex = require('safe-regex');
var logger_1 = require("./logger");
var rds_configurator = require("./rds_config");
var rds_handler = require("./rds_packages");
var fsExtra = require("fs-extra");
var child_process_1 = require("child_process");
var path = require("path");
var s3_packages_1 = require("./s3_packages");
var metrics_1 = require("./src/assets/metrics");
var package_objs_1 = require("./package_objs");
var app = express();
exports.app = app;
var port = process.env.PORT || 8080;
var upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());
function extractRepoInfo(zipFilePath) {
    var _this = this;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            yauzl.open(zipFilePath, { lazyEntries: true }, function (err, zipfile) {
                if (err || !zipfile) {
                    reject(err || new Error('Unable to open zip file'));
                    return "Unable to open zip file";
                }
                zipfile.on('entry', function (entry) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, logger_1.logger.info("Entry Name: ".concat(entry.fileName))];
                            case 1:
                                _a.sent();
                                if (/\/package\.json$/.test(entry.fileName)) {
                                    zipfile.openReadStream(entry, function (err, readStream) {
                                        if (err || !readStream) {
                                            reject(err || new Error('Unable to read package.json'));
                                            return "Unable to read package.json";
                                        }
                                        var fileContent = '';
                                        readStream.on('data', function (data) {
                                            fileContent += data;
                                        });
                                        readStream.on('end', function () {
                                            try {
                                                var jsonObject = JSON.parse(fileContent);
                                                if ('repository' in jsonObject && 'url' in jsonObject.repository && 'version' in jsonObject) {
                                                    var info = {
                                                        version: jsonObject.version,
                                                        url: jsonObject.repository.url
                                                    };
                                                    resolve(info);
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
                        }
                    });
                }); });
                zipfile.on('end', function () {
                    reject(new Error('Package.json not found in the zip'));
                });
                zipfile.readEntry();
            });
            return [2 /*return*/];
        });
    }); });
}
//TODO: if RDS succeeds to upload but S3 fails, remove the corresponding RDS entry
app.post('/package', upload.single('file'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, parts, repositoryName, npmPackageName, output, file, gitUrl, destinationPath, cloneRepoOut, zipFilePath, version_1, username, repo, gitInfo, gitDetails, scores, info, package_version, metadata, package_id, zippedFileContent, zippedFile, s3_response, base64EncodedData, response, error_1, binaryData_1, uploadDir, timestamp, zipFilePath_1, writeStream_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(req.body.URL && !req.body.Content)) return [3 /*break*/, 36];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 32, , 35]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Attempting to ingest package')];
            case 3:
                _a.sent();
                url = req.body.URL;
                return [4 /*yield*/, logger_1.logger.info("package url: ".concat(req.body.URL))];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("req: ".concat(JSON.stringify(req.body)))];
            case 5:
                _a.sent();
                if (!url.includes("github")) return [3 /*break*/, 7];
                parts = url.split('/');
                repositoryName = parts[parts.length - 1];
                // Constructing the npm package URL
                url = "https://www.npmjs.com/package/".concat(repositoryName);
                return [4 /*yield*/, logger_1.logger.info("constructed npm package url: ".concat(url))];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                npmPackageName = (0, metrics_1.get_npm_package_name)(url);
                return [4 /*yield*/, logger_1.logger.info("package name: ".concat(npmPackageName))];
            case 8:
                _a.sent();
                output = (0, child_process_1.execSync)("npm view ".concat(npmPackageName, " --json --silent"), { encoding: 'utf8' });
                fs.writeFileSync("./temp_npm_json/".concat(npmPackageName, "_info.json"), output); // write json to file
                return [4 /*yield*/, logger_1.logger.info("wrote json file")];
            case 9:
                _a.sent();
                file = "./temp_npm_json/".concat(npmPackageName, "_info.json");
                return [4 /*yield*/, (0, metrics_1.check_npm_for_open_source)(file)];
            case 10:
                gitUrl = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("gitUrl: ".concat(gitUrl))];
            case 11:
                _a.sent();
                destinationPath = 'temp_linter_test';
                return [4 /*yield*/, (0, metrics_1.cloneRepo)(gitUrl, destinationPath)];
            case 12:
                cloneRepoOut = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("finished cloning")];
            case 13:
                _a.sent();
                return [4 /*yield*/, (0, metrics_1.zipDirectory)(cloneRepoOut[1], "./tempZip.zip")];
            case 14:
                zipFilePath = _a.sent();
                version_1 = "";
                fs.readFile(path.join('./src/assets/temp_linter_test', 'package.json'), 'utf8', function (err, data) { return __awaiter(void 0, void 0, void 0, function () {
                    var packageJson, error_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (err) {
                                    console.error('Error reading file:', err);
                                    return [2 /*return*/];
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 5]);
                                packageJson = JSON.parse(data);
                                version_1 = packageJson.version;
                                return [4 /*yield*/, logger_1.logger.info("version found: ".concat(version_1))];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 5];
                            case 3:
                                error_3 = _a.sent();
                                return [4 /*yield*/, logger_1.logger.info("error searching version: ".concat(error_3))];
                            case 4:
                                _a.sent();
                                return [3 /*break*/, 5];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); });
                username = "";
                repo = "";
                gitInfo = (0, metrics_1.get_github_info)(gitUrl);
                username = gitInfo.username;
                repo = gitInfo.repo;
                return [4 /*yield*/, logger_1.logger.info("username and repo found successfully: ".concat(username, ", ").concat(repo))];
            case 15:
                _a.sent();
                gitDetails = [{ username: username, repo: repo }];
                return [4 /*yield*/, (0, metrics_1.get_metric_info)(gitDetails)];
            case 16:
                scores = _a.sent();
                //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
                return [4 /*yield*/, logger_1.logger.info("retrieved scores from score calculator: ".concat(scores.BusFactor, ", ").concat(scores.RampUp, ", ").concat(scores.LicenseScore, ", ").concat(scores.Correctness, ", ").concat(scores.ResponsiveMaintainer, ", ").concat(scores.PullRequest, ", ").concat(scores.GoodPinningPractice, ", ").concat(scores.NetScore))];
            case 17:
                //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
                _a.sent();
                // We check if the rating is sufficient and return if it is not
                if (scores.NetScore < 0.5) {
                    logger_1.logger.info("Upload aborted, insufficient rating of ".concat(scores.NetScore));
                    logger_1.time.info('Aborted at this time\n');
                    res.status(424).send("Package is not uploaded due to the disqualified rating.");
                }
                info = {
                    version: version_1,
                    url: repo
                };
                package_version = info.version;
                metadata = {
                    Name: npmPackageName,
                    Version: package_version,
                    ID: (0, package_objs_1.generate_id)(npmPackageName, package_version)
                };
                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores)];
            case 18:
                package_id = _a.sent();
                if (!(package_id === null)) return [3 /*break*/, 21];
                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
            case 19:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 20:
                _a.sent();
                return [2 /*return*/, res.status(409).send('Package exists already.')];
            case 21: return [4 /*yield*/, logger_1.logger.debug("ingest package to rds with id: ".concat(package_id))
                // Upload the actual package to s3
                // Read the zipped file content
            ];
            case 22:
                _a.sent();
                zippedFileContent = fs.readFileSync(zipFilePath);
                return [4 /*yield*/, logger_1.logger.debug("got zipped file content")
                    // Create Express.Multer.File object
                ];
            case 23:
                _a.sent();
                zippedFile = {
                    fieldname: 'file',
                    originalname: 'zipped_directory.zip',
                    encoding: '7bit',
                    mimetype: 'application/zip',
                    buffer: zippedFileContent // Buffer of the zipped file content
                };
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, zippedFile)];
            case 24:
                s3_response = _a.sent();
                if (!(s3_response === null)) return [3 /*break*/, 27];
                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
            case 25:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 26:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Could not add package data')];
            case 27: 
            // If you get to this point, the file has been successfully uploaded
            return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
            case 28:
                // If you get to this point, the file has been successfully uploaded
                _a.sent();
                return [4 /*yield*/, fsExtra.remove(cloneRepoOut[1])];
            case 29:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.debug("removed clone repo")];
            case 30:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 31:
                _a.sent();
                base64EncodedData = (zippedFileContent).toString('base64');
                response = {
                    metadata: metadata,
                    data: {
                        Content: base64EncodedData,
                        JSProgram: "Not Implementing",
                    },
                };
                // Old return value
                //{"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": zippedFile.buffer, "JSProgram": "Not Implementing"}};
                res.status(201).json(response);
                return [3 /*break*/, 35];
            case 32:
                error_1 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not ingest package', error_1)];
            case 33:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 34:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 35];
            case 35: return [3 /*break*/, 51];
            case 36:
                if (!(!req.body.URL && req.body.Content)) return [3 /*break*/, 50];
                _a.label = 37;
            case 37:
                _a.trys.push([37, 46, , 49]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 38:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Attempting to upload package')];
            case 39:
                _a.sent();
                binaryData_1 = Buffer.from(req.body.Content, 'base64');
                return [4 /*yield*/, logger_1.logger.info("Got buffer/binary data")];
            case 40:
                _a.sent();
                uploadDir = './uploads';
                if (!!fs.existsSync(uploadDir)) return [3 /*break*/, 42];
                fs.mkdirSync(uploadDir);
                return [4 /*yield*/, logger_1.logger.info("created upload directory")];
            case 41:
                _a.sent();
                return [3 /*break*/, 44];
            case 42: return [4 /*yield*/, logger_1.logger.info("upload directory exists already, no need to make it")];
            case 43:
                _a.sent();
                _a.label = 44;
            case 44:
                timestamp = Date.now();
                zipFilePath_1 = path.join(uploadDir, "file_".concat(timestamp, ".zip"));
                return [4 /*yield*/, logger_1.logger.info("Got zip file path: ".concat(zipFilePath_1))];
            case 45:
                _a.sent();
                writeStream_1 = fs.createWriteStream(zipFilePath_1);
                writeStream_1.write(binaryData_1, function (err) { return __awaiter(void 0, void 0, void 0, function () {
                    var info, repoUrl, version, username, repo, regex, matches, gitDetails, scores, metadata, package_id, file, s3_response, response;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!err) return [3 /*break*/, 2];
                                return [4 /*yield*/, logger_1.logger.info("failed to save zip file")];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 20];
                            case 2: return [4 /*yield*/, logger_1.logger.info("zip file saved successfully")];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, extractRepoInfo(zipFilePath_1)];
                            case 4:
                                info = _a.sent();
                                repoUrl = info.url;
                                version = info.version;
                                return [4 /*yield*/, logger_1.logger.info("retrieved repo url: ".concat(repoUrl))];
                            case 5:
                                _a.sent();
                                username = "";
                                repo = "";
                                regex = /\/([^\/]+)\/([^\/]+)\.git$/;
                                matches = repoUrl.match(regex);
                                if (matches) {
                                    username = matches[1];
                                    repo = matches[2];
                                }
                                return [4 /*yield*/, logger_1.logger.info("username and repo found successfully: ".concat(username, ", ").concat(repo))];
                            case 6:
                                _a.sent();
                                gitDetails = [{ username: username, repo: repo }];
                                return [4 /*yield*/, (0, metrics_1.get_metric_info)(gitDetails)];
                            case 7:
                                scores = _a.sent();
                                //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
                                return [4 /*yield*/, logger_1.logger.info("retrieved scores from score calculator: ".concat(scores.BusFactor, ", ").concat(scores.RampUp, ", ").concat(scores.LicenseScore, ", ").concat(scores.Correctness, ", ").concat(scores.ResponsiveMaintainer, ", ").concat(scores.PullRequest, ", ").concat(scores.GoodPinningPractice, ", ").concat(scores.NetScore))];
                            case 8:
                                //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
                                _a.sent();
                                fs.unlinkSync(zipFilePath_1);
                                metadata = {
                                    Name: repo,
                                    Version: version,
                                    ID: (0, package_objs_1.generate_id)(repo, version),
                                };
                                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores)];
                            case 9:
                                package_id = _a.sent();
                                if (!(package_id === null)) return [3 /*break*/, 12];
                                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
                            case 10:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
                            case 11:
                                _a.sent();
                                return [2 /*return*/, res.status(409).send('Package exists already.')];
                            case 12: return [4 /*yield*/, logger_1.logger.debug("Uploaded package to rds with id: ".concat(package_id))
                                // Upload the actual package to s3
                            ];
                            case 13:
                                _a.sent();
                                file = { buffer: binaryData_1 };
                                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, file)];
                            case 14:
                                s3_response = _a.sent();
                                if (!(s3_response === null)) return [3 /*break*/, 17];
                                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
                            case 15:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
                            case 16:
                                _a.sent();
                                return [2 /*return*/, res.status(400).send('Could not add package data')];
                            case 17: return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
                            case 18:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")
                                    // Original response
                                    //let response = {"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": req.file.buffer, "JSProgram": "Not Implementing"}};
                                    //New response
                                ];
                            case 19:
                                _a.sent();
                                response = {
                                    metadata: metadata,
                                    data: {
                                        Content: String(req.body.Content),
                                        JSProgram: "Not Implementing",
                                    },
                                };
                                res.status(201).json(response);
                                _a.label = 20;
                            case 20:
                                writeStream_1.end();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [3 /*break*/, 49];
            case 46:
                error_2 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not upload package', error_2)];
            case 47:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 48:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 49];
            case 49: return [3 /*break*/, 51];
            case 50:
                // Impropper request
                res.status(400).send("There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.");
                _a.label = 51;
            case 51: return [2 /*return*/];
        }
    });
}); });
app.get('/package/:id/rate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, scores, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 14, , 17]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to get package rating")];
            case 2:
                _a.sent();
                package_id = req.params.id;
                return [4 /*yield*/, logger_1.logger.debug("Attempting to rate package with id: ".concat(package_id))];
            case 3:
                _a.sent();
                return [4 /*yield*/, rds_handler.get_package_rating(package_id)];
            case 4:
                scores = _a.sent();
                if (!(scores === null)) return [3 /*break*/, 7];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 6:
                _a.sent();
                return [2 /*return*/, res.status(404).json('Package does not exist.')];
            case 7: return [4 /*yield*/, logger_1.logger.info("Received package data from RDS: ".concat(scores))];
            case 8:
                _a.sent();
                if (!!scores) return [3 /*break*/, 11];
                return [4 /*yield*/, logger_1.logger.error("No rate data found for package with id: ".concat(package_id))];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 10:
                _a.sent();
                return [2 /*return*/, res.status(404).send('Rate data not found.')];
            case 11: return [4 /*yield*/, logger_1.logger.info("Rate data found for package with id: ".concat(package_id, ", rateData: ").concat(scores.BusFactor, ", ").concat(scores.RampUp, ", ").concat(scores.LicenseScore, ", ").concat(scores.Correctness, ", ").concat(scores.ResponsiveMaintainer, ", ").concat(scores.PullRequest, ", ").concat(scores.GoodPinningPractice, ", ").concat(scores.NetScore))];
            case 12:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 13:
                _a.sent();
                res.status(200).json(scores);
                return [3 /*break*/, 17];
            case 14:
                error_4 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error rating package:', error_4)];
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
app.get('/package/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, metadata, package_name, data, pkg, error_5;
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
                package_id = req.params.packageId;
                return [4 /*yield*/, rds_handler.get_package_metadata(package_id)];
            case 3:
                metadata = _a.sent();
                if (!(metadata === null)) return [3 /*break*/, 6];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 5:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package metadata not found' })];
            case 6: return [4 /*yield*/, logger_1.logger.debug("Package data found for package with id: ".concat(package_id))];
            case 7:
                _a.sent();
                package_name = metadata.Name;
                return [4 /*yield*/, (0, s3_packages_1.download_package)(package_id)];
            case 8:
                data = _a.sent();
                if (!(data === null)) return [3 /*break*/, 11];
                return [4 /*yield*/, logger_1.logger.error("Package with id: ".concat(package_id, " not found in S3"))];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 10:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package data not found' })];
            case 11:
                res.attachment(package_name + '.zip'); // Set the desired new file name here
                res.setHeader('Content-Type', 'application/zip');
                pkg = {
                    metadata: metadata,
                    data: data,
                };
                return [4 /*yield*/, logger_1.logger.info("Successfully downloaded package with id ".concat(package_id))];
            case 12:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 13:
                _a.sent();
                res.status(200).json(pkg);
                return [3 /*break*/, 17];
            case 14:
                error_5 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error downloading package:', error_5)];
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
    var packageName, version, offsetValue, searchResults, package_names, error_6;
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
                if (version == undefined || version == "*") {
                    version = ".*";
                }
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
                return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination(".*", version, false, offsetValue)];
            case 13:
                searchResults = _a.sent();
                return [3 /*break*/, 16];
            case 14: return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination("".concat(packageName), version, true, offsetValue)];
            case 15:
                searchResults = _a.sent();
                _a.label = 16;
            case 16:
                package_names = searchResults.map(function (data) { return ({
                    Version: data.version,
                    Name: data.name,
                    ID: data.id,
                }); });
                return [4 /*yield*/, logger_1.logger.info("Successfully got packages (/packages): ".concat(JSON.stringify(package_names)))];
            case 17:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 18:
                _a.sent();
                res.setHeader('offset', offsetValue + 2);
                res.status(200).json(package_names);
                return [3 /*break*/, 22];
            case 19:
                error_6 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_6)];
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
    var timeout, searchString, searchResults, package_names, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                timeout = setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: 
                            // If the endpoint takes longer than 5 sec, send an error response
                            return [4 /*yield*/, logger_1.logger.info("Detected unsafe regex")];
                            case 1:
                                // If the endpoint takes longer than 5 sec, send an error response
                                _a.sent();
                                res.status(500).send('Request timeout');
                                return [2 /*return*/];
                        }
                    });
                }); }, 5000);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 13, , 16]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to search packages")];
            case 3:
                _a.sent();
                searchString = req.body.RegEx;
                if (!!searchString) return [3 /*break*/, 6];
                return [4 /*yield*/, logger_1.logger.error('No search string was given')];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 5:
                _a.sent();
                clearTimeout(timeout);
                return [2 /*return*/, res.status(400).send('Search string is required.')];
            case 6: return [4 /*yield*/, rds_handler.match_rds_rows(searchString)];
            case 7:
                searchResults = _a.sent();
                package_names = searchResults.map(function (data) { return ({
                    Version: data.version,
                    Name: data.name,
                }); });
                if (!(package_names.length === 0)) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.error("No packages found that match ".concat(searchString))];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Finished at this time\n')];
            case 9:
                _a.sent();
                clearTimeout(timeout);
                return [2 /*return*/, res.status(404).send("No package found under this regex")];
            case 10: return [4 /*yield*/, logger_1.logger.info("Successfully searched packages")];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 12:
                _a.sent();
                clearTimeout(timeout);
                res.status(200).json(package_names);
                return [3 /*break*/, 16];
            case 13:
                error_7 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_7)];
            case 14:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 15:
                _a.sent();
                clearTimeout(timeout);
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
// Resets RDS and S3
app.delete('/reset', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_8;
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
                error_8 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error resetting system:', error_8)];
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
    var packageName, searchResults, package_id, error_9;
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
                package_id = searchResults.map(function (data) { return data.id; });
                return [4 /*yield*/, logger_1.logger.debug("Package ID found for package '".concat(packageName, "': ").concat(package_id))];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 8:
                _a.sent();
                res.status(200).json({ package_id: package_id });
                return [3 /*break*/, 12];
            case 9:
                error_9 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error getting package ID by name:', error_9)];
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
app.put('/package/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, metadata, data, Name, Version, ID, Content, URL_1, JSProgram, existingPackage, rowsUpdated, npmURL, parts, repositoryName, npmPackageName, output, file, gitUrl, destinationPath, cloneRepoOut, zipFilePath, zippedFileContent, zippedFile, s3_response, binaryData, file, s3Url, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 28, , 31]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _b.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to update package content")];
            case 2:
                _b.sent();
                _a = req.body, metadata = _a.metadata, data = _a.data;
                Name = metadata.Name, Version = metadata.Version, ID = metadata.ID;
                Content = data.Content, URL_1 = data.URL, JSProgram = data.JSProgram;
                return [4 /*yield*/, logger_1.logger.logger("Input: ".concat(Name, ", ").concat(Version, ", ").concat(ID))];
            case 3:
                _b.sent();
                return [4 /*yield*/, rds_handler.get_package_metadata(ID)];
            case 4:
                existingPackage = _b.sent();
                if (!!existingPackage) return [3 /*break*/, 7];
                return [4 /*yield*/, logger_1.logger.error("No package found with ID: ".concat(ID))];
            case 5:
                _b.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 6:
                _b.sent();
                return [2 /*return*/, res.status(404).json('Package does not exist.')];
            case 7: return [4 /*yield*/, rds_handler.update_rds_package_data(ID, Name, Version)];
            case 8:
                rowsUpdated = _b.sent();
                if (!(URL_1 && !Content)) return [3 /*break*/, 21];
                return [4 /*yield*/, logger_1.logger.logger("Updating via URL")];
            case 9:
                _b.sent();
                npmURL = void 0;
                if (!URL_1.includes("github")) return [3 /*break*/, 11];
                parts = URL_1.split('/');
                repositoryName = parts[parts.length - 1];
                // Constructing the npm package URL
                npmURL = "https://www.npmjs.com/package/".concat(repositoryName);
                return [4 /*yield*/, logger_1.logger.info("constructed npm package url: ".concat(npmURL))];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11:
                npmPackageName = (0, metrics_1.get_npm_package_name)(String(npmURL));
                return [4 /*yield*/, logger_1.logger.info("package name: ".concat(npmPackageName))];
            case 12:
                _b.sent();
                output = (0, child_process_1.execSync)("npm view ".concat(npmPackageName, " --json --silent"), { encoding: 'utf8' });
                fs.writeFileSync("./temp_npm_json/".concat(npmPackageName, "_info.json"), output); // write json to file
                return [4 /*yield*/, logger_1.logger.info("wrote json file")];
            case 13:
                _b.sent();
                file = "./temp_npm_json/".concat(npmPackageName, "_info.json");
                return [4 /*yield*/, (0, metrics_1.check_npm_for_open_source)(file)];
            case 14:
                gitUrl = _b.sent();
                return [4 /*yield*/, logger_1.logger.info("gitUrl: ".concat(gitUrl))];
            case 15:
                _b.sent();
                destinationPath = 'temp_linter_test';
                return [4 /*yield*/, (0, metrics_1.cloneRepo)(gitUrl, destinationPath)];
            case 16:
                cloneRepoOut = _b.sent();
                return [4 /*yield*/, logger_1.logger.info("finished cloning")];
            case 17:
                _b.sent();
                return [4 /*yield*/, (0, metrics_1.zipDirectory)(cloneRepoOut[1], "./tempZip.zip")];
            case 18:
                zipFilePath = _b.sent();
                zippedFileContent = fs.readFileSync(zipFilePath);
                return [4 /*yield*/, logger_1.logger.debug("got zipped file content")
                    // Create Express.Multer.File object
                ];
            case 19:
                _b.sent();
                zippedFile = {
                    fieldname: 'file',
                    originalname: 'zipped_directory.zip',
                    encoding: '7bit',
                    mimetype: 'application/zip',
                    buffer: zippedFileContent // Buffer of the zipped file content
                };
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(ID, zippedFile)];
            case 20:
                s3_response = _b.sent();
                return [3 /*break*/, 25];
            case 21:
                if (!(!URL_1 && Content)) return [3 /*break*/, 24];
                return [4 /*yield*/, logger_1.logger.logger("Updating via content")];
            case 22:
                _b.sent();
                binaryData = Buffer.from(req.body.Content, 'base64');
                file = { buffer: binaryData };
                return [4 /*yield*/, (0, s3_packages_1.updateS3Package)(ID, file)];
            case 23:
                s3Url = _b.sent();
                return [3 /*break*/, 25];
            case 24: return [2 /*return*/, res.status(400).json('Package does not exist.')];
            case 25: return [4 /*yield*/, logger_1.logger.info("There is missing field(s) in the PackageID/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.")];
            case 26:
                _b.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 27:
                _b.sent();
                res.status(200).send('Version is updated.');
                return [3 /*break*/, 31];
            case 28:
                error_10 = _b.sent();
                return [4 /*yield*/, logger_1.logger.error('Error updating package content:', error_10)];
            case 29:
                _b.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 30:
                _b.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 31];
            case 31: return [2 /*return*/];
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
