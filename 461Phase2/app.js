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
var port = process.env.PORT || 8080;
var upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.post('/upload', upload.single('file'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, s3_response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 20, , 23]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info('Attempting to upload package')];
            case 2:
                _a.sent();
                if (!!req.file) return [3 /*break*/, 5];
                return [4 /*yield*/, logger_1.logger.error('No file to upload')];
            case 3:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 4:
                _a.sent();
                return [2 /*return*/, res.status(400).send('No file uploaded.')];
            case 5:
                if (!!req.file.originalname.endsWith('.zip')) return [3 /*break*/, 8];
                return [4 /*yield*/, logger_1.logger.error('The given file is not a zip file')];
            case 6:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 7:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Invalid file format. Please upload a zip file.')];
            case 8: return [4 /*yield*/, rds_handler.add_rds_package_data(req.file.originalname.replace(/\.zip$/, ''), {})];
            case 9:
                package_id = _a.sent();
                if (!(package_id === null)) return [3 /*break*/, 12];
                return [4 /*yield*/, logger_1.logger.error("Could not upload package data to RDS")];
            case 10:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 11:
                _a.sent();
                return [2 /*return*/, res.status(400).send('Could not add package metadata')];
            case 12: return [4 /*yield*/, logger_1.logger.debug("Uploaded package to rds with id: ".concat(package_id))
                // Upload the actual package to s3
            ];
            case 13:
                _a.sent();
                return [4 /*yield*/, (0, s3_packages_1.upload_package)(package_id, req.file)];
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
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 19:
                _a.sent();
                res.status(200).send("Package uploaded successfully");
                return [3 /*break*/, 23];
            case 20:
                error_1 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Could not upload package', error_1)];
            case 21:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 22:
                _a.sent();
                res.status(500).send('An error occurred.');
                return [3 /*break*/, 23];
            case 23: return [2 /*return*/];
        }
    });
}); });
app.get('/rate/:packageId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var package_id, package_data, rateData, error_2;
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
                rateData = package_data.rating;
                if (!!rateData) return [3 /*break*/, 10];
                return [4 /*yield*/, logger_1.logger.error("No rate data found for package with id: ".concat(package_id))];
            case 8:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 9:
                _a.sent();
                return [2 /*return*/, res.status(404).send('Rate data not found.')];
            case 10: return [4 /*yield*/, logger_1.logger.info("Rate data found for package with id: ".concat(package_id, ", rateData: ").concat(rateData))];
            case 11:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 12:
                _a.sent();
                res.status(200).json(rateData);
                return [3 /*break*/, 16];
            case 13:
                error_2 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error rating package:', error_2)];
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
    var package_id, package_data, package_name, package_buffer, error_3;
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
                package_name = package_data.package_name;
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
                error_3 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error downloading package:', error_3)];
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
                _a.trys.push([0, 9, , 12]);
                return [4 /*yield*/, logger_1.time.info("Starting time")];
            case 1:
                _a.sent();
                return [4 /*yield*/, logger_1.logger.info("Attempting to search packages")];
            case 2:
                _a.sent();
                searchString = req.query.q;
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
                package_names = searchResults.map(function (data) { return data.package_name; });
                return [4 /*yield*/, logger_1.logger.info("Successfully searched packages")];
            case 7:
                _a.sent();
                return [4 /*yield*/, logger_1.time.info("Finished at this time\n")];
            case 8:
                _a.sent();
                res.status(200).json(package_names);
                return [3 /*break*/, 12];
            case 9:
                error_4 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error searching packages:', error_4)];
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
// Resets RDS and S3
app.post('/reset', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
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
                res.status(200).send('Successfully reset system to original state');
                return [3 /*break*/, 11];
            case 8:
                error_5 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error resetting system:', error_5)];
            case 9:
                _a.sent();
                return [4 /*yield*/, logger_1.time.error('Error occurred at this time\n')];
            case 10:
                _a.sent();
                res.status(500).send('An error occurred while resetting the registry.');
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.get('/packageId/:packageName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var packageName, searchResults, package_id, error_6;
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
                error_6 = _a.sent();
                return [4 /*yield*/, logger_1.logger.error('Error getting package ID by name:', error_6)];
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
