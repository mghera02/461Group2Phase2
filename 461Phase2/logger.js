"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.getLogger = void 0;
var winston = require('winston'); //Logging library
var dotenv = require("dotenv");
dotenv.config();
var logLevels = {
    0: 'silent',
    1: 'info',
    2: 'debug',
};
var logLevels_ = {
    silent: 0,
    info: 1,
    debug: 2,
};
function getLogLevel() {
    var logLevel = Number(process.env.LOG_LEVEL);
    if (!logLevel) {
        // Default log level is 0
        return logLevels[0];
    }
    else if (logLevel > 2) {
        // Just for convenience, instead of panicking
        return logLevels[2];
    }
    else if (logLevel < 0) {
        // Also just for convenience, instead of panicking
        return logLevels[0];
    }
    return logLevels[logLevel];
}
function getLogPath() {
    var logPath = process.env.LOG_FILE;
    if (!logPath) {
        var error = new Error("Could not find LOG_FILE path, please make sure it is valid");
        console.error("Error: ".concat(error));
        throw error;
    }
    return logPath;
}
function getLogger() {
    var logLevel = getLogLevel();
    var logPath = getLogPath();
    var logger = winston.createLogger({
        level: logLevel,
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({ filename: logPath, level: logLevel }), // Actual log file
        ],
    });
    return logger;
}
exports.getLogger = getLogger;
exports.logger = getLogger();
