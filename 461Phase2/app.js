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
var token = '0';
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
                        //await logger.info(`Entry Name: ${entry.fileName}`);
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
    var authenticationToken, JSProgram, url, parts, repositoryName, npmPackageName, output, file, gitUrl, destinationPath, cloneRepoOut, zipFilePath, version_1, username, repo, gitInfo, gitDetails, scores, info, package_version, metadata, package_id, zippedFileContent, zippedFile, s3_response, base64EncodedData, response, error_1, binaryData_1, uploadDir, timestamp, zipFilePath_1, writeStream_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                JSProgram = "";
                if (req.body.JSProgram) {
                    JSProgram = req.body.JSProgram;
                }
                if (!(req.body.URL && !req.body.Content)) return [3 /*break*/, 40];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 35, , 39]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Ingesting package (POST /package)')];
            case 5:
                _a.sent();
                url = req.body.URL;
                return [4 /*yield*/, logger_1.logger.info("req: ".concat(JSON.stringify(req.body)))];
            case 6:
                _a.sent();
                if (!url.includes("github")) return [3 /*break*/, 8];
                parts = url.split('/');
                repositoryName = parts[parts.length - 1];
                // Constructing the npm package URL
                url = "https://www.npmjs.com/package/".concat(repositoryName);
                return [4 /*yield*/, logger_1.logger.info("constructed npm package url: ".concat(url))];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                npmPackageName = (0, metrics_1.get_npm_package_name)(url);
                return [4 /*yield*/, logger_1.logger.info("package name: ".concat(npmPackageName))];
            case 9:
                _a.sent();
                output = (0, child_process_1.execSync)("npm view ".concat(npmPackageName, " --json --silent"), { encoding: 'utf8' });
                fs.writeFileSync("./temp_npm_json/".concat(npmPackageName, "_info.json"), output); // write json to file
                return [4 /*yield*/, logger_1.logger.info("wrote json file")];
            case 10:
                _a.sent();
                file = "./temp_npm_json/".concat(npmPackageName, "_info.json");
                return [4 /*yield*/, (0, metrics_1.check_npm_for_open_source)(file)];
            case 11:
                gitUrl = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("gitUrl: ".concat(gitUrl))];
            case 12:
                _a.sent();
                destinationPath = 'temp_linter_test';
                return [4 /*yield*/, (0, metrics_1.cloneRepo)(gitUrl, destinationPath)];
            case 13:
                cloneRepoOut = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("finished cloning")];
            case 14:
                _a.sent();
                return [4 /*yield*/, (0, metrics_1.zipDirectory)(cloneRepoOut[1], "./tempZip.zip")];
            case 15:
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
            case 16:
                _a.sent();
                gitDetails = [{ username: username, repo: repo }];
                return [4 /*yield*/, (0, metrics_1.get_metric_info)(gitDetails)];
            case 17:
                scores = _a.sent();
                //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
                return [4 /*yield*/, logger_1.logger.info("retrieved scores from score calculator: ".concat(scores.BusFactor, ", ").concat(scores.RampUp, ", ").concat(scores.LicenseScore, ", ").concat(scores.Correctness, ", ").concat(scores.ResponsiveMaintainer, ", ").concat(scores.PullRequest, ", ").concat(scores.GoodPinningPractice, ", ").concat(scores.NetScore))];
            case 18:
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
                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores, JSProgram)];
            case 19:
                package_id = _a.sent();
                if (!(package_id === null)) return [3 /*break*/, 23];
                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
            case 20:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 21:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 22:
                _a.sent();
                return [2 /*return*/, res.status(409).send('Package exists already.')];
            case 23: return [4 /*yield*/, logger_1.logger.debug("ingest package to rds with id: ".concat(package_id))
                // Upload the actual package to s3
                // Read the zipped file content
            ];
            case 24:
                _a.sent();
                zippedFileContent = fs.readFileSync(zipFilePath);
                return [4 /*yield*/, logger_1.logger.debug("got zipped file content")
                    // Create Express.Multer.File object
                ];
            case 25:
                _a.sent();
                zippedFile = {
                    fieldname: 'file',
                    originalname: 'zipped_directory.zip',
                    encoding: '7bit',
                    mimetype: 'application/zip',
                    buffer: zippedFileContent // Buffer of the zipped file content
                };
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, zippedFile)];
            case 26:
                s3_response = _a.sent();
                if (!(s3_response === null)) return [3 /*break*/, 30];
                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
            case 27:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 28:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 29:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Could not add package data')];
            case 30: 
            // If you get to this point, the file has been successfully uploaded
            return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
            case 31:
                // If you get to this point, the file has been successfully uploaded
                _a.sent();
                return [4 /*yield*/, fsExtra.remove(cloneRepoOut[1])];
            case 32:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.debug("removed clone repo")];
            case 33:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 34:
                _a.sent();
                base64EncodedData = (zippedFileContent).toString('base64');
                response = {
                    metadata: metadata,
                    data: {
                        Content: base64EncodedData,
                        //JSProgram: JSProgram,
                    },
                };
                // Old return value
                //{"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": zippedFile.buffer, "JSProgram": "Not Implementing"}};
                res.status(201).json(response);
                return [3 /*break*/, 39];
            case 35:
                error_1 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not ingest package', error_1)];
            case 36:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 37:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 38:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 39];
            case 39: return [3 /*break*/, 57];
            case 40:
                if (!(!req.body.URL && req.body.Content)) return [3 /*break*/, 56];
                _a.label = 41;
            case 41:
                _a.trys.push([41, 51, , 55]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 42:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 43:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Uploading package (POST /package)')];
            case 44:
                _a.sent();
                binaryData_1 = Buffer.from(req.body.Content, 'base64');
                return [4 /*yield*/, logger_1.logger.info("Got buffer/binary data")];
            case 45:
                _a.sent();
                uploadDir = './uploads';
                if (!!fs.existsSync(uploadDir)) return [3 /*break*/, 47];
                fs.mkdirSync(uploadDir);
                return [4 /*yield*/, logger_1.logger.info("created upload directory")];
            case 46:
                _a.sent();
                return [3 /*break*/, 49];
            case 47: return [4 /*yield*/, logger_1.logger.info("upload directory exists already, no need to make it")];
            case 48:
                _a.sent();
                _a.label = 49;
            case 49:
                timestamp = Date.now();
                zipFilePath_1 = path.join(uploadDir, "file_".concat(timestamp, ".zip"));
                return [4 /*yield*/, logger_1.logger.info("Got zip file path: ".concat(zipFilePath_1))];
            case 50:
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
                                return [3 /*break*/, 23];
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
                                return [4 /*yield*/, rds_handler.add_rds_package_data(metadata, scores, JSProgram)];
                            case 9:
                                package_id = _a.sent();
                                if (!(package_id === null)) return [3 /*break*/, 13];
                                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
                            case 10:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
                            case 11:
                                _a.sent();
                                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
                            case 12:
                                _a.sent();
                                return [2 /*return*/, res.status(409).send('Package exists already.')];
                            case 13: return [4 /*yield*/, logger_1.logger.debug("Uploaded package to rds with id: ".concat(package_id))
                                // Upload the actual package to s3
                            ];
                            case 14:
                                _a.sent();
                                file = { buffer: binaryData_1 };
                                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, file)];
                            case 15:
                                s3_response = _a.sent();
                                if (!(s3_response === null)) return [3 /*break*/, 19];
                                return [4 /*yield*/, logger_1.logger.error("Error uploading package to S3")];
                            case 16:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
                            case 17:
                                _a.sent();
                                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
                            case 18:
                                _a.sent();
                                return [2 /*return*/, res.status(400).send('Could not add package data')];
                            case 19:
                                response = {
                                    metadata: metadata,
                                    data: {
                                        Content: String(req.body.Content),
                                        //JSProgram: JSProgram,
                                    },
                                };
                                return [4 /*yield*/, logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id))];
                            case 20:
                                _a.sent();
                                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
                            case 21:
                                _a.sent();
                                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
                            case 22:
                                _a.sent();
                                res.status(201).json(response);
                                _a.label = 23;
                            case 23:
                                writeStream_1.end();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [3 /*break*/, 55];
            case 51:
                error_2 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not upload package', error_2)];
            case 52:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 53:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 54:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 55];
            case 55: return [3 /*break*/, 57];
            case 56:
                // Impropper request
                res.status(400).send("There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.");
                _a.label = 57;
            case 57: return [2 /*return*/];
        }
    });
}); });
app.get('/package/:id/rate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, package_id, scores, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _a.label = 2;
            case 2:
                _a.trys.push([2, 20, , 24]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Rating package (GET /package/:id/rate)")];
            case 5:
                _a.sent();
                package_id = req.params.id;
                return [4 /*yield*/, logger_1.logger.debug("Attempting to rate package with id: ".concat(package_id))];
            case 6:
                _a.sent();
                return [4 /*yield*/, rds_handler.get_package_rating(package_id)];
            case 7:
                scores = _a.sent();
                if (!(scores === null)) return [3 /*break*/, 11];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 10:
                _a.sent();
                return [2 /*return*/, res.status(404).json('Package does not exist.')];
            case 11: return [4 /*yield*/, logger_1.logger.info("Received package data from RDS: ".concat(JSON.stringify(scores)))];
            case 12:
                _a.sent();
                if (!!scores) return [3 /*break*/, 16];
                return [4 /*yield*/, logger_1.logger.error("No rate data found for package with id: ".concat(package_id))];
            case 13:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 14:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 15:
                _a.sent();
                return [2 /*return*/, res.status(404).send('Rate data not found.')];
            case 16: 
            //await logger.debug(`Rate data found for package with id: ${package_id}, rateData: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
            return [4 /*yield*/, logger_1.logger.info("res: ".concat(JSON.stringify(scores)))];
            case 17:
                //await logger.debug(`Rate data found for package with id: ${package_id}, rateData: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 18:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 19:
                _a.sent();
                res.status(200).json(scores);
                return [3 /*break*/, 24];
            case 20:
                error_4 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error rating package:', error_4)];
            case 21:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 22:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 23:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 24];
            case 24: return [2 /*return*/];
        }
    });
}); });
app.get('/package/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, package_id, metadata, package_name, package_ID, package_Version, JSProgram, data, data2, buffer, base64Encoded, pkg, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _a.label = 2;
            case 2:
                _a.trys.push([2, 23, , 27]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Downloading package (GET /package/:packageId)")];
            case 5:
                _a.sent();
                package_id = req.params.packageId;
                if (!!package_id) return [3 /*break*/, 8];
                return [4 /*yield*/, logger_1.time.info('No ID provided')];
            case 6:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 7:
                _a.sent();
                return [2 /*return*/, res.status(400).json('There is missing field(s) in the PackageID/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.')];
            case 8: return [4 /*yield*/, rds_handler.get_package_metadata(package_id)];
            case 9:
                metadata = _a.sent();
                if (!(metadata == null)) return [3 /*break*/, 13];
                return [4 /*yield*/, logger_1.logger.error("No package found with id: ".concat(package_id))];
            case 10:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 12:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package metadata not found' })];
            case 13: return [4 /*yield*/, logger_1.logger.debug("Package data found for package with id: ".concat(package_id))];
            case 14:
                _a.sent();
                package_name = metadata.name;
                package_ID = metadata.id;
                package_Version = metadata.version;
                JSProgram = metadata.JSProgram;
                return [4 /*yield*/, (0, s3_packages_1.download_package)(package_id)];
            case 15:
                data = _a.sent();
                data2 = data.Content;
                buffer = Buffer.from(data2);
                base64Encoded = buffer.toString('base64');
                if (!(data === null)) return [3 /*break*/, 19];
                return [4 /*yield*/, logger_1.logger.error("Package with id: ".concat(package_id, " not found in S3"))];
            case 16:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 17:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 18:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package data not found' })];
            case 19:
                res.attachment(package_name + '.zip'); // Set the desired new file name here
                res.setHeader('Content-Type', 'application/zip');
                pkg = {
                    metadata: { Name: package_name, ID: package_id, Version: package_Version },
                    data: { Content: base64Encoded },
                    //data: {Content: base64Encoded, JSProgram: JSProgram},
                };
                return [4 /*yield*/, logger_1.logger.info("Successfully downloaded package with id ".concat(package_id))];
            case 20:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 21:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 22:
                _a.sent();
                res.status(200).json(pkg);
                return [3 /*break*/, 27];
            case 23:
                error_5 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error downloading package:', error_5)];
            case 24:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 25:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 26:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 27];
            case 27: return [2 /*return*/];
        }
    });
}); });
app.post('/packages', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, packageName, version_2, rangeResults, _i, rangeResults_1, result, operator, rangeParts, minRange, maxRange, versionNumbers, offsetValue, searchResults, package_names, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _a.label = 2;
            case 2:
                _a.trys.push([2, 53, , 57]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Listing packages (POST /packages)")];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("req: ".concat(JSON.stringify(req.body)))];
            case 6:
                _a.sent();
                packageName = req.body[0].Name;
                version_2 = req.body[0].Version;
                return [4 /*yield*/, logger_1.logger.info("Length of req body: ".concat(req.body.length))];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Got req.body.Name:".concat(req.body[0].Name, ", req.body.Version:").concat(req.body[0].Version))];
            case 8:
                _a.sent();
                if (!(version_2 == undefined || version_2 == null || version_2 == "*" || version_2.length == 0)) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.info("Setting version to .*")];
            case 9:
                _a.sent();
                version_2 = ".*";
                _a.label = 10;
            case 10:
                if (!!packageName) return [3 /*break*/, 13];
                return [4 /*yield*/, logger_1.logger.error('No name was given')];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 12:
                _a.sent();
                return [2 /*return*/, res.status(400).send('There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.')];
            case 13:
                if (!(version_2 != ".*")) return [3 /*break*/, 41];
                return [4 /*yield*/, logger_1.logger.info("version: ".concat(version_2))];
            case 14:
                _a.sent();
                return [4 /*yield*/, rds_handler.match_rds_rows(packageName)];
            case 15:
                rangeResults = _a.sent();
                return [4 /*yield*/, logger_1.logger.info("rangeResults: ".concat(rangeResults))];
            case 16:
                _a.sent();
                _i = 0, rangeResults_1 = rangeResults;
                _a.label = 17;
            case 17:
                if (!(_i < rangeResults_1.length)) return [3 /*break*/, 41];
                result = rangeResults_1[_i];
                return [4 /*yield*/, logger_1.logger.info("result version: ".concat(result.version))];
            case 18:
                _a.sent();
                operator = "";
                if (version_2.charAt(0) == '^') {
                    version_2 = version_2.substring(1);
                    operator = '^';
                }
                else if (version_2.charAt(0) == '~') {
                    version_2 = version_2.substring(1);
                    operator = '~';
                }
                rangeParts = version_2.split('-');
                return [4 /*yield*/, logger_1.logger.info("rangeParts: ".concat(rangeParts))];
            case 19:
                _a.sent();
                minRange = void 0;
                maxRange = void 0;
                if (!(rangeParts.length > 1)) return [3 /*break*/, 22];
                minRange = rangeParts[0].split('.').map(Number);
                maxRange = rangeParts[1].split('.').map(Number);
                return [4 /*yield*/, logger_1.logger.info("minRange: ".concat(minRange))];
            case 20:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("maxRange: ".concat(maxRange))];
            case 21:
                _a.sent();
                return [3 /*break*/, 24];
            case 22:
                minRange = version_2.split('.').map(Number);
                return [4 /*yield*/, logger_1.logger.info("minRange: ".concat(minRange))];
            case 23:
                _a.sent();
                _a.label = 24;
            case 24:
                versionNumbers = result.version.split('.').map(Number);
                return [4 /*yield*/, logger_1.logger.info("version number: ".concat(versionNumbers))];
            case 25:
                _a.sent();
                if (!(operator == "^")) return [3 /*break*/, 29];
                return [4 /*yield*/, logger_1.logger.info("version range is ^")];
            case 26:
                _a.sent();
                if (!(versionNumbers[0] * 100 + versionNumbers[1] * 10 + versionNumbers[2] >= minRange[0] * 100 + minRange[1] * 10 + minRange[2])) return [3 /*break*/, 28];
                return [4 /*yield*/, logger_1.logger.info("version is in range")];
            case 27:
                _a.sent();
                version_2 = result.version;
                _a.label = 28;
            case 28: return [3 /*break*/, 40];
            case 29:
                if (!(operator == "~")) return [3 /*break*/, 33];
                return [4 /*yield*/, logger_1.logger.info("version range is ~")];
            case 30:
                _a.sent();
                if (!(versionNumbers[0] == minRange[0] &&
                    versionNumbers[1] == minRange[1])) return [3 /*break*/, 32];
                return [4 /*yield*/, logger_1.logger.info("version is in range")];
            case 31:
                _a.sent();
                version_2 = result.version;
                _a.label = 32;
            case 32: return [3 /*break*/, 40];
            case 33:
                if (!(version_2.indexOf('-') !== -1)) return [3 /*break*/, 37];
                return [4 /*yield*/, logger_1.logger.info("version range is -")];
            case 34:
                _a.sent();
                if (!(versionNumbers[0] * 100 + versionNumbers[1] * 10 + versionNumbers[2] >= minRange[0] * 100 + minRange[1] * 10 + minRange[2] &&
                    versionNumbers[0] * 100 + versionNumbers[1] * 10 + versionNumbers[2] <= maxRange[0] * 100 + maxRange[1] * 10 + maxRange[2])) return [3 /*break*/, 36];
                return [4 /*yield*/, logger_1.logger.info("version is in range")];
            case 35:
                _a.sent();
                version_2 = result.version;
                _a.label = 36;
            case 36: return [3 /*break*/, 40];
            case 37: return [4 /*yield*/, logger_1.logger.info("version range is single")];
            case 38:
                _a.sent();
                if (!(version_2 == result.version)) return [3 /*break*/, 40];
                return [4 /*yield*/, logger_1.logger.info("version is in range")];
            case 39:
                _a.sent();
                version_2 = result.version;
                _a.label = 40;
            case 40:
                _i++;
                return [3 /*break*/, 17];
            case 41:
                offsetValue = void 0;
                if (!(req.query.offset !== undefined)) return [3 /*break*/, 43];
                offsetValue = parseInt(req.query.offset);
                return [4 /*yield*/, logger_1.logger.info("Offset: ".concat(offsetValue))];
            case 42:
                _a.sent();
                return [3 /*break*/, 45];
            case 43:
                offsetValue = 0;
                return [4 /*yield*/, logger_1.logger.info('Offset is not provided in the query parameters')];
            case 44:
                _a.sent();
                _a.label = 45;
            case 45:
                searchResults = void 0;
                if (!(packageName == "*")) return [3 /*break*/, 47];
                return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination(".*", version_2, false, offsetValue)];
            case 46:
                searchResults = _a.sent();
                return [3 /*break*/, 49];
            case 47: return [4 /*yield*/, rds_handler.match_rds_rows_with_pagination("".concat(packageName), version_2, true, offsetValue)];
            case 48:
                searchResults = _a.sent();
                _a.label = 49;
            case 49:
                package_names = searchResults.map(function (data) { return ({
                    Version: version_2,
                    Name: data.name,
                    ID: data.id,
                }); });
                return [4 /*yield*/, logger_1.logger.info("Successfully got packages (/packages): ".concat(JSON.stringify(package_names)))];
            case 50:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 51:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 52:
                _a.sent();
                res.setHeader('offset', offsetValue + 2);
                res.status(200).json(package_names);
                return [3 /*break*/, 57];
            case 53:
                error_6 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_6)];
            case 54:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 55:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 56:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 57];
            case 57: return [2 /*return*/];
        }
    });
}); });
// Sends the a list of package names that match the regex
app.post('/package/byRegEx', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, timeout, searchString, searchResults, package_names, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                timeout = setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: 
                            // If the endpoint takes longer than 5 sec, send an error response
                            return [4 /*yield*/, logger_1.logger.info("Detected unsafe regex")];
                            case 1:
                                // If the endpoint takes longer than 5 sec, send an error response
                                _a.sent();
                                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
                            case 2:
                                _a.sent();
                                res.status(500).send('Request timeout');
                                return [2 /*return*/];
                        }
                    });
                }); }, 5000);
                _a.label = 2;
            case 2:
                _a.trys.push([2, 20, , 24]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Searching packages (POST /package/byRegEx)")];
            case 5:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("req: ".concat(JSON.stringify(req.body)))];
            case 6:
                _a.sent();
                searchString = req.body.RegEx;
                if (!!searchString) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.error('No search string was given')];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 9:
                _a.sent();
                clearTimeout(timeout);
                return [2 /*return*/, res.status(400).send('Search string is required.')];
            case 10: return [4 /*yield*/, rds_handler.match_rds_rows(searchString)];
            case 11:
                searchResults = _a.sent();
                package_names = searchResults.map(function (data) { return ({
                    Version: data.version,
                    Name: data.name,
                }); });
                return [4 /*yield*/, logger_1.logger.info("package_names: ".concat(JSON.stringify(package_names)))];
            case 12:
                _a.sent();
                if (!(package_names.length === 0)) return [3 /*break*/, 16];
                return [4 /*yield*/, logger_1.logger.error("No packages found that match ".concat(searchString))];
            case 13:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Finished at this time\n')];
            case 14:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 15:
                _a.sent();
                clearTimeout(timeout);
                return [2 /*return*/, res.status(404).send("No package found under this regex")];
            case 16: return [4 /*yield*/, logger_1.logger.info("Successfully searched packages")];
            case 17:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 18:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 19:
                _a.sent();
                clearTimeout(timeout);
                res.status(200).json(package_names);
                return [3 /*break*/, 24];
            case 20:
                error_7 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_7)];
            case 21:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 22:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 23:
                _a.sent();
                clearTimeout(timeout);
                res.status(404).send('No package found under this regex.');
                return [3 /*break*/, 24];
            case 24: return [2 /*return*/];
        }
    });
}); });
// Resets RDS and S3
app.delete('/reset', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _a.label = 2;
            case 2:
                _a.trys.push([2, 12, , 16]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("System reset (/reset)")];
            case 5:
                _a.sent();
                return [4 /*yield*/, (0, s3_packages_1.clear_s3_bucket)()];
            case 6:
                _a.sent();
                return [4 /*yield*/, rds_configurator.drop_package_data_table()];
            case 7:
                _a.sent();
                return [4 /*yield*/, rds_configurator.setup_rds_tables()];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Successfully cleared Databses and reset to original state')];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 10:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 11:
                _a.sent();
                res.status(200).send('Registry is reset.');
                return [3 /*break*/, 16];
            case 12:
                error_8 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error resetting system:', error_8)];
            case 13:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 14:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 15:
                _a.sent();
                res.status(500).send('An error occurred while resetting the registry');
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
app.get('/packageId/:packageName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, packageName, searchResults, package_id, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _a.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _a.label = 2;
            case 2:
                _a.trys.push([2, 14, , 18]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to get package ID by name (GET /packageId/:packageName)")];
            case 5:
                _a.sent();
                packageName = req.params.packageName;
                return [4 /*yield*/, rds_handler.match_rds_rows(packageName)];
            case 6:
                searchResults = _a.sent();
                if (!!searchResults) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.error("No package found with name: ".concat(packageName))];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 9:
                _a.sent();
                return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
            case 10:
                package_id = searchResults.map(function (data) { return data.id; });
                return [4 /*yield*/, logger_1.logger.debug("Package ID found for package '".concat(packageName, "': ").concat(package_id))];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 12:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 13:
                _a.sent();
                res.status(200).json({ package_id: package_id });
                return [3 /*break*/, 18];
            case 14:
                error_9 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error getting package ID by name:', error_9)];
            case 15:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 16:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 17:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 18];
            case 18: return [2 /*return*/];
        }
    });
}); });
app.put('/package/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticationToken, _a, metadata, data, Name, Version, ID, Content, URL_1, JSProgram, existingPackage, rowsUpdated, npmURL, parts, repositoryName, npmPackageName, output, file, gitUrl, destinationPath, cloneRepoOut, zipFilePath, zippedFileContent, zippedFile, s3_response, binaryData, file, s3Url, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                authenticationToken = req.get('X-Authorization');
                return [4 /*yield*/, logger_1.logger.info("XAuth: ".concat(authenticationToken))];
            case 1:
                _b.sent();
                if (!authenticationToken || authenticationToken !== token) {
                    return [2 /*return*/, res.status(400).json('Auth not given')];
                }
                _b.label = 2;
            case 2:
                _b.trys.push([2, 33, , 37]);
                return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 3:
                _b.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 4:
                _b.sent();
                return [4 /*yield*/, logger_1.logger.info("Updating Package (PUT /package/:id)")];
            case 5:
                _b.sent();
                _a = req.body, metadata = _a.metadata, data = _a.data;
                Name = metadata.Name, Version = metadata.Version, ID = metadata.ID;
                Content = data.Content;
                URL_1 = data.URL;
                JSProgram = data.JSProgram;
                return [4 /*yield*/, logger_1.logger.info("Input: ".concat(Name, ", ").concat(Version, ", ").concat(ID, ", ").concat(JSProgram, ", ").concat(URL_1))];
            case 6:
                _b.sent();
                if (JSProgram == "" || JSProgram == undefined || JSProgram == null || JSProgram.length == 0) {
                    JSProgram = "no";
                }
                return [4 /*yield*/, rds_handler.get_package_metadata(ID)];
            case 7:
                existingPackage = _b.sent();
                if (!!existingPackage) return [3 /*break*/, 11];
                return [4 /*yield*/, logger_1.logger.error("No package found with ID: ".concat(ID))];
            case 8:
                _b.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 9:
                _b.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 10:
                _b.sent();
                return [2 /*return*/, res.status(404).json('Package does not exist.')];
            case 11: return [4 /*yield*/, rds_handler.update_rds_package_data(ID, Name, Version, JSProgram)];
            case 12:
                rowsUpdated = _b.sent();
                if (!(URL_1 && !Content)) return [3 /*break*/, 25];
                return [4 /*yield*/, logger_1.logger.info("Updating via URL")];
            case 13:
                _b.sent();
                npmURL = void 0;
                if (!URL_1.includes("github")) return [3 /*break*/, 15];
                parts = URL_1.split('/');
                repositoryName = parts[parts.length - 1];
                // Constructing the npm package URL
                npmURL = "https://www.npmjs.com/package/".concat(repositoryName);
                return [4 /*yield*/, logger_1.logger.info("constructed npm package url: ".concat(npmURL))];
            case 14:
                _b.sent();
                _b.label = 15;
            case 15:
                npmPackageName = (0, metrics_1.get_npm_package_name)(String(npmURL));
                return [4 /*yield*/, logger_1.logger.info("package name: ".concat(npmPackageName))];
            case 16:
                _b.sent();
                output = (0, child_process_1.execSync)("npm view ".concat(npmPackageName, " --json --silent"), { encoding: 'utf8' });
                fs.writeFileSync("./temp_npm_json/".concat(npmPackageName, "_info.json"), output); // write json to file
                return [4 /*yield*/, logger_1.logger.info("wrote json file")];
            case 17:
                _b.sent();
                file = "./temp_npm_json/".concat(npmPackageName, "_info.json");
                return [4 /*yield*/, (0, metrics_1.check_npm_for_open_source)(file)];
            case 18:
                gitUrl = _b.sent();
                return [4 /*yield*/, logger_1.logger.info("gitUrl: ".concat(gitUrl))];
            case 19:
                _b.sent();
                destinationPath = 'temp_linter_test';
                return [4 /*yield*/, (0, metrics_1.cloneRepo)(gitUrl, destinationPath)];
            case 20:
                cloneRepoOut = _b.sent();
                return [4 /*yield*/, logger_1.logger.info("finished cloning")];
            case 21:
                _b.sent();
                return [4 /*yield*/, (0, metrics_1.zipDirectory)(cloneRepoOut[1], "./tempZip.zip")];
            case 22:
                zipFilePath = _b.sent();
                zippedFileContent = fs.readFileSync(zipFilePath);
                return [4 /*yield*/, logger_1.logger.debug("got zipped file content")
                    // Create Express.Multer.File object
                ];
            case 23:
                _b.sent();
                zippedFile = {
                    fieldname: 'file',
                    originalname: 'zipped_directory.zip',
                    encoding: '7bit',
                    mimetype: 'application/zip',
                    buffer: zippedFileContent // Buffer of the zipped file content
                };
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(ID, zippedFile)];
            case 24:
                s3_response = _b.sent();
                return [3 /*break*/, 30];
            case 25:
                if (!(!URL_1 && Content)) return [3 /*break*/, 28];
                return [4 /*yield*/, logger_1.logger.info("Updating via content")];
            case 26:
                _b.sent();
                binaryData = Buffer.from(Content, 'base64');
                file = { buffer: binaryData };
                return [4 /*yield*/, (0, s3_packages_1.updateS3Package)(ID, file)];
            case 27:
                s3Url = _b.sent();
                return [3 /*break*/, 30];
            case 28: return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 29:
                _b.sent();
                return [2 /*return*/, res.status(400).json('Package does not exist.')];
            case 30: return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 31:
                _b.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 32:
                _b.sent();
                res.status(200).send('Version is updated.');
                return [3 /*break*/, 37];
            case 33:
                error_10 = _b.sent();
                return [4 /*yield*/, logger_1.logger.error('Error updating package content:', error_10)];
            case 34:
                _b.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 35:
                _b.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 36:
                _b.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 37];
            case 37: return [2 /*return*/];
        }
    });
}); });
app.put('/authenticate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Request received for authentication')];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 3:
                _a.sent();
                res.status(501).send('This system does not support authentication.');
                return [2 /*return*/];
        }
    });
}); });
app.delete('/package/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, deletionStatus;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Deleting package version (delete /package/:id)")];
            case 3:
                _a.sent();
                package_id = req.params.id;
                return [4 /*yield*/, logger_1.logger.debug("Attempting to delete package with id: ".concat(package_id))];
            case 4:
                _a.sent();
                if (!package_id) return [3 /*break*/, 8];
                return [4 /*yield*/, rds_handler.delete_rds_package_data(package_id)];
            case 5:
                deletionStatus = _a.sent();
                return [4 /*yield*/, logger_1.logger.debug("Deletion status result: ".concat(deletionStatus))];
            case 6:
                _a.sent();
                return [4 /*yield*/, (0, s3_packages_1.delete_package_from_s3)(package_id)];
            case 7:
                _a.sent();
                if (deletionStatus) {
                    res.status(200).send('Package is deleted.');
                }
                else {
                    res.status(404).send('Package does not exist.');
                }
                return [3 /*break*/, 9];
            case 8:
                res.status(404).send('There is missing field(s) in the PackageID/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
                _a.label = 9;
            case 9: return [2 /*return*/];
        }
    });
}); });
app.get('/package/byName/:name', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Request received for package history')];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 3:
                _a.sent();
                res.status(501).send('This system does not support package history.');
                return [2 /*return*/];
        }
    });
}); });
app.delete('/package/byName/:name', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logger_1.logger.info("\n-----------------------------------------")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Request received for package deletion 2')];
            case 2:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("-----------------------------------------\n")];
            case 3:
                _a.sent();
                res.status(501).send('This system does not support deletion.');
                return [2 /*return*/];
        }
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
