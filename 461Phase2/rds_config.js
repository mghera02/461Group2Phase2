"use strict";
// This file contains all of the functions to make large scale changes 
// with the RDS such as setting up a connection, setting up the tables, clearing the tables and so on.
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
exports.TABLE_NAME = exports.display_package_data = exports.clear_package_data = exports.drop_package_data_table = exports.setup_rds_tables = exports.get_rds_connection = void 0;
// ALL FUNCTIONS IN THIS FOLDER ARE EXPORTED TO app.mjs
// TO RUN THESE FUNCTIONS, RUN app.mjs
var pg_1 = require("pg");
var dotenv = require("dotenv");
var logger_1 = require("./logger");
dotenv.config();
var user = String(process.env.RDS_USER);
var host = String(process.env.RDS_HOST);
var password = String(process.env.RDS_PASSWORD);
var database = String(process.env.RDS_DB_NAME);
var dbConfig = {
    user: user,
    host: host,
    database: database,
    password: password,
    port: 5432,
    ssl: {
        // Set the SSL option
        rejectUnauthorized: false, // Reject self-signed certificates (recommended for production)
    },
};
var TABLE_NAME = 'package_data';
exports.TABLE_NAME = TABLE_NAME;
function get_rds_connection() {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new pg_1.Client(dbConfig);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _a.sent();
                    logger_1.logger.debug('Successfully connected to RDS');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    logger_1.logger.error('Error connecting to the database:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, client];
            }
        });
    });
}
exports.get_rds_connection = get_rds_connection;
function setup_rds_tables() {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, get_rds_connection()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    return [4 /*yield*/, client.query("\n          CREATE TABLE IF NOT EXISTS package_data (\n            id VARCHAR(50) UNIQUE NOT NULL,\n            name VARCHAR(50) NOT NULL,\n            version VARCHAR(50) NOT NULL,\n            rating JSON NOT NULL,\n            num_downloads INT NOT NULL,\n            JSProgram VARCHAR(400) NOT NULL\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n          );\n        ")];
                case 3:
                    _a.sent();
                    logger_1.logger.debug("Successfully created tables");
                    return [3 /*break*/, 7];
                case 4:
                    error_2 = _a.sent();
                    logger_1.logger.error('Error creating table:', error_2);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.setup_rds_tables = setup_rds_tables;
function drop_package_data_table() {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, get_rds_connection()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    return [4 /*yield*/, client.query("DROP TABLE IF EXISTS ".concat(TABLE_NAME))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    error_3 = _a.sent();
                    logger_1.logger.error('Error creating table:', error_3);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.drop_package_data_table = drop_package_data_table;
function clear_package_data() {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, get_rds_connection()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    return [4 /*yield*/, client.query('DELETE FROM package_data')];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    error_4 = _a.sent();
                    console.error('Error clearing package data:', error_4);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.clear_package_data = clear_package_data;
function display_package_data() {
    return __awaiter(this, void 0, void 0, function () {
        var client, result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, get_rds_connection()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    return [4 /*yield*/, client.query('SELECT * FROM package_data')];
                case 3:
                    result = _a.sent();
                    console.log('Package data:');
                    console.log(result.rows);
                    return [3 /*break*/, 7];
                case 4:
                    error_5 = _a.sent();
                    console.error('Error displaying package data:', error_5);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.display_package_data = display_package_data;
