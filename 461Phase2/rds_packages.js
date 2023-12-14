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
exports.delete_rds_package_data = exports.update_rds_package_data = exports.match_rds_rows_with_pagination = exports.match_rds_rows = exports.get_package_rating = exports.get_package_metadata = exports.add_rds_package_data = void 0;
var rds_config_1 = require("./rds_config");
var logger_1 = require("./logger");
function row_to_metadata(row) {
    if (row === null) {
        return null;
    }
    var metadata = {
        Name: row.name,
        Version: row.version,
        ID: row.id,
    };
    return metadata;
}
// Adds data to the amazon RDS instance. That data is assigned a unique ID that is returned.
// This ID is used to locate the package contents in the S3 bucket.
function add_rds_package_data(metadata, rating, JSProgram) {
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = "\n        INSERT INTO package_data(name, version, id, rating, num_downloads, JSProgram) VALUES($1, $2, $3, $4, $5, $6)\n        RETURNING id;\n      ";
                    values = [metadata.Name, metadata.Version, metadata.ID, rating, 0, JSProgram];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    result = _a.sent();
                    // Making sure something is returned at all
                    if (result.rowCount == 0) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, result.rows[0].id];
                case 4:
                    error_1 = _a.sent();
                    logger_1.logger.error('Error entering data:', error_1);
                    return [2 /*return*/, null];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.add_rds_package_data = add_rds_package_data;
function update_rds_package_data(id, newName, newVersion, JSProgram) {
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = "\n      UPDATE package_data \n      SET name = $1, version = $2, JSProgram = $3\n      WHERE id = $4\n    ";
                    values = [newName, newVersion, JSProgram, id];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    result = _a.sent();
                    // Check if any rows were affected
                    return [2 /*return*/, result.rowCount];
                case 4:
                    error_2 = _a.sent();
                    logger_1.logger.error('Error updating data:', error_2);
                    return [2 /*return*/, 0];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.update_rds_package_data = update_rds_package_data;
function get_package_metadata(package_id) {
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, data, metadata, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = "\n        SELECT * FROM ".concat(rds_config_1.TABLE_NAME, " WHERE id = $1\n      ");
                    values = [package_id];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    data = _a.sent();
                    // Making sure something is returned at all
                    if (data.rowCount == 0) {
                        return [2 /*return*/, null];
                    }
                    metadata = data.rows[0];
                    return [2 /*return*/, metadata];
                case 4:
                    error_3 = _a.sent();
                    logger_1.logger.error('Error grabbing data:', error_3);
                    return [2 /*return*/, null];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.get_package_metadata = get_package_metadata;
function get_package_rating(package_id) {
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, data, rating, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = "\n        SELECT rating FROM ".concat(rds_config_1.TABLE_NAME, " WHERE id = $1\n      ");
                    values = [package_id];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    data = _a.sent();
                    // Making sure something is returned at all
                    if (data.rowCount == 0) {
                        return [2 /*return*/, null];
                    }
                    rating = data.rows[0].rating;
                    return [2 /*return*/, rating];
                case 4:
                    error_4 = _a.sent();
                    logger_1.logger.error('Error grabbing data:', error_4);
                    return [2 /*return*/, null];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.get_package_rating = get_package_rating;
function match_rds_rows(regex, useExactMatch) {
    if (useExactMatch === void 0) { useExactMatch = false; }
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = void 0;
                    if (useExactMatch) {
                        query = "\n            SELECT * FROM ".concat(rds_config_1.TABLE_NAME, "\n            WHERE name = $1;\n        ");
                    }
                    else {
                        query = "\n            SELECT * FROM ".concat(rds_config_1.TABLE_NAME, "\n            WHERE name ~ $1;\n        ");
                    }
                    values = [regex];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    result = _a.sent();
                    logger_1.logger.debug('Query result:', JSON.stringify(result.rows));
                    return [2 /*return*/, result.rows];
                case 4:
                    error_5 = _a.sent();
                    logger_1.logger.error('Error searching data:', error_5);
                    return [2 /*return*/, []];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.match_rds_rows = match_rds_rows;
function match_rds_rows_with_pagination(regex, version, useExactMatch, offset) {
    if (useExactMatch === void 0) { useExactMatch = false; }
    if (offset === void 0) { offset = 0; }
    return __awaiter(this, void 0, void 0, function () {
        var client, limit, query, values, result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    limit = 2;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = void 0;
                    values = [regex];
                    if (useExactMatch) {
                        query = "\n              SELECT * FROM ".concat(rds_config_1.TABLE_NAME, "\n              WHERE name = $1\n              AND version ~ $4\n              LIMIT $2 OFFSET $3;\n          ");
                        values.push(limit.toString(), offset.toString(), version.toString());
                    }
                    else {
                        query = "\n              SELECT * FROM ".concat(rds_config_1.TABLE_NAME, "\n              WHERE name ~ $1\n              AND version ~ $4\n              LIMIT $2 OFFSET $3;\n          ");
                        values.push(limit.toString(), offset.toString(), version.toString());
                    }
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    result = _a.sent();
                    logger_1.logger.debug('Query result:', JSON.stringify(result));
                    return [2 /*return*/, result.rows];
                case 4:
                    error_6 = _a.sent();
                    logger_1.logger.error('Error searching data:', error_6);
                    return [2 /*return*/, []];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.match_rds_rows_with_pagination = match_rds_rows_with_pagination;
function delete_rds_package_data(id) {
    return __awaiter(this, void 0, void 0, function () {
        var client, query, values, result, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, rds_config_1.get_rds_connection)()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    query = "\n      DELETE FROM package_data WHERE id = $1\n      RETURNING id;\n    ";
                    values = [id];
                    return [4 /*yield*/, client.query(query, values)];
                case 3:
                    result = _a.sent();
                    // Checking if any rows were affected
                    if (result.rowCount === 0) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_7 = _a.sent();
                    logger_1.logger.error('Error deleting data:', error_7);
                    return [2 /*return*/, false];
                case 5: return [4 /*yield*/, client.end()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.delete_rds_package_data = delete_rds_package_data;
