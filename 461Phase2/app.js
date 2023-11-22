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
var express = require('express');
var multer = require('multer');
// import AWS from 'aws-sdk';
var cors = require('cors');
var logger_1 = require("./logger");
var rds_configurator = require("./rds_config");
var rds_handler = require("./rds_packages");
var s3_packages_1 = require("./s3_packages");
var app = express();
var port = 3000;
var upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.post('/upload', upload.single('file'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, s3_response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).send('No file uploaded.')];
                }
                if (!req.file.originalname.endsWith('.zip')) {
                    return [2 /*return*/, res.status(400).send('Invalid file format. Please upload a zip file.')];
                }
                return [4 /*yield*/, rds_handler.add_rds_package_data(req.file.originalname.replace(/\.zip$/, ''), {})];
            case 1:
                package_id = _a.sent();
                // Check to see if package metadata was upladed to RDS
                if (package_id === null) {
                    logger_1.logger.error("Could not upload package data to RDS");
                    return [2 /*return*/, res.status(400).send('Could not add package metadata')];
                }
                logger_1.logger.debug("Uploaded package to rds with id: ".concat(package_id));
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, req.file)];
            case 2:
                s3_response = _a.sent();
                // Check to see if package data was uploaded to S3
                if (s3_response === null) {
                    logger_1.logger.error("Error uploading package to S3");
                    return [2 /*return*/, res.status(400).send('Could not add package data')];
                }
                logger_1.logger.info("Successfully uploaded package with id: ".concat(package_id));
                res.status(200).send("Package uploaded successfully");
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                logger_1.logger.error('Could not upload package', error_1);
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get('/rate/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, package_data, rateData, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                package_id = parseInt(req.params.packageId);
                logger_1.logger.debug("Attempting to rate package with id: ".concat(package_id));
                return [4 /*yield*/, rds_handler.get_package_data(package_id)];
            case 1:
                package_data = _a.sent();
                if (package_data === null) {
                    logger_1.logger.error("No package found with id: ".concat(package_id));
                    return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
                }
                rateData = package_data.rating;
                if (!rateData) {
                    logger_1.logger.error("No rate data found for package with id: ".concat(package_id));
                    return [2 /*return*/, res.status(404).send('Rate data not found.')];
                }
                logger_1.logger.info("Rate data found for package with id: ".concat(package_id, ", rateData: ").concat(rateData));
                res.status(200).json(rateData);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.logger.error('Error rating package:', error_2);
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/download/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, package_data, package_name, package_buffer, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                package_id = parseInt(req.params.packageId);
                return [4 /*yield*/, rds_handler.get_package_data(package_id)];
            case 1:
                package_data = _a.sent();
                if (package_data === null) {
                    logger_1.logger.error("No package found with id: ".concat(package_id));
                    return [2 /*return*/, res.status(404).json({ error: 'Package not found' })];
                }
                logger_1.logger.debug("Package data found for package with id: ".concat(package_id));
                package_name = package_data.package_name;
                return [4 /*yield*/, (0, s3_packages_1.download_package)(package_id)];
            case 2:
                package_buffer = _a.sent();
                if (package_buffer === null) {
                    logger_1.logger.error("Package with id: ".concat(package_id, " not found in S3"));
                    return [2 /*return*/, res.status(404).json({ error: 'Package file not found' })];
                }
                res.attachment(package_name + '.zip'); // Set the desired new file name here
                res.setHeader('Content-Type', 'application/zip');
                logger_1.logger.info("Successfully downloaded package with id ".concat(package_id));
                res.status(200).send(package_buffer);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                logger_1.logger.error('Error downloading package:', error_3);
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get('/packages', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/];
    });
}); });
// Sends the a list of package names that match the regex
app.get('/search', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var searchString, searchResults, package_names, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                searchString = req.query.q;
                if (!searchString) {
                    return [2 /*return*/, res.status(400).send('Search string is required.')];
                }
                return [4 /*yield*/, rds_handler.match_rds_rows(searchString)];
            case 1:
                searchResults = _a.sent();
                package_names = searchResults.map(function (data) { return data.package_name; });
                logger_1.logger.info("Successfully searched packages");
                res.status(200).json(package_names);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_1.logger.error('Error:', error_4);
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Resets RDS and S3
app.post('/reset', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
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
                return [4 /*yield*/, (0, s3_packages_1.clear_s3_bucket)()];
            case 1:
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
                _a.sent();
                return [4 /*yield*/, rds_configurator.drop_package_data_table()];
            case 2:
                _a.sent();
                return [4 /*yield*/, rds_configurator.setup_rds_tables()];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                logger_1.logger.error('Error clearing databases:', error_5);
                res.status(500).send('An error occurred while resetting the registry.');
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.listen(port, function () {
    logger_1.logger.info("Server is running on port ".concat(port));
});
