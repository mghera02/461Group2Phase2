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
exports.get_metric_info = void 0;
var octokit_1 = require("octokit"); // Octokit v17
var exec = require('child_process').exec; // to execute shell cmds async version
var fs = require("fs");
var logger_1 = require("../../logger");
var gitHubToken = String(process.env.GITHUB_TOKEN);
var octokit = new octokit_1.Octokit({
    auth: gitHubToken,
    userAgent: 'pkg-manager/v1.0.0'
});
function calcuBusFactor(x) {
    var result = (Math.pow((Math.log(x + 1) / (Math.log(1500 + 1))), 1.22));
    //console.log(`Bus Factor: ${result}`);
    return result;
}
function calcRampUpScore(x) {
    var result = (1 - (Math.pow((Math.log(x + 1) / (Math.log(105906 + 1))), 1.22)));
    //console.log(`Ramp Up: ${result}`);
    return result;
}
function calcLicenseScore(licenseName) {
    var licenseScore = 0;
    var lowercaseLicense = licenseName.toLowerCase();
    if (lowercaseLicense.includes('apache') || lowercaseLicense.includes('mit') || lowercaseLicense.includes('gpl') || lowercaseLicense.includes('bsd')) {
        licenseScore = 1;
    }
    return licenseScore;
}
function calcCorrectnessScore(errors, filecount) {
    // lets get the errors/warnings per file
    // we really only care about errors
    var errorsPerFile = errors / filecount;
    var scaledError = 0;
    var correctnessScore = 0;
    if (errorsPerFile > 1 && errorsPerFile < 10) {
        scaledError = errorsPerFile / 10;
    }
    else if (errorsPerFile > 10 && errorsPerFile < 100) {
        scaledError = errorsPerFile / 100;
    }
    else if (errorsPerFile > 100) { // if we have 100 errors per file this is not good 
        scaledError = 1;
    }
    if (scaledError === 1) { // we got way too many errors per file, cannot be a good file
        correctnessScore = 0;
    }
    else {
        correctnessScore = (1 - (scaledError));
    }
    //console.log(`Correctness: ${correctnessScore}`);
    return correctnessScore;
}
function calcRespMaintScore(timeDifference, username, repo) {
    var sum = timeDifference.reduce(function (acc, value) { return acc + value; }, 0);
    var avg = sum / timeDifference.length;
    var maintainer = (1 - (avg / (86400000 * 30)));
    if (maintainer < 0) { // if average response is greater than a month 
        maintainer = 0;
    }
    else {
        maintainer = (1 - (avg / (86400000 * 30)));
    }
    //console.log(`Responsive Maintainer: ${maintainer}`);
    return maintainer;
}
function calcTotalScore(busFactor, rampup, license, correctness, maintainer, pullRequest, pinning) {
    return __awaiter(this, void 0, void 0, function () {
        var busWeight, rampupWeight, respMaintWeight, correctnessWeight, pinningWeight, pullRequestWeight, busScore, rampupScore, respMaintScore, correctnessScore, pinningScore, pullRequestScore, score;
        return __generator(this, function (_a) {
            busWeight = 0.10;
            rampupWeight = 0.10;
            respMaintWeight = 0.30;
            correctnessWeight = 0.30;
            pinningWeight = 0.10;
            pullRequestWeight = 0.10;
            busScore = busFactor * busWeight;
            rampupScore = rampup * rampupWeight;
            respMaintScore = maintainer * respMaintWeight;
            correctnessScore = correctness * correctnessWeight;
            pinningScore = pinning * pinningWeight;
            pullRequestScore = pullRequest * pullRequestWeight;
            score = license * (busScore + rampupScore + respMaintScore + correctnessScore + pinningScore + pullRequestScore);
            //console.log(`Total Score: ${score.toFixed(5)}`); // can allow more or less decimal, five for now
            return [2 /*return*/, score];
        });
    });
}
function get_metric_info(gitDetails) {
    return __awaiter(this, void 0, void 0, function () {
        var i, gitInfo, busFactor, license, rampup, correctness, maintainer, pinning, pullRequest, score, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logger_1.logger.info("Getting metric info: ".concat(gitDetails[0].username, ", ").concat(gitDetails[0].repo))];
                case 1:
                    _a.sent();
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < gitDetails.length)) return [3 /*break*/, 17];
                    gitInfo = gitDetails[i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 14, , 16]);
                    //console.log(`Getting Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                    //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
                    return [4 /*yield*/, createLintDirs(gitInfo.username, gitInfo.repo)];
                case 4:
                    //console.log(`Getting Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                    //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
                    _a.sent();
                    return [4 /*yield*/, fetchRepoContributors(gitInfo.username, gitInfo.repo)];
                case 5:
                    busFactor = _a.sent();
                    return [4 /*yield*/, fetchRepoLicense(gitInfo.username, gitInfo.repo)];
                case 6:
                    license = _a.sent();
                    return [4 /*yield*/, fetchRepoReadme(gitInfo.username, gitInfo.repo)];
                case 7:
                    rampup = _a.sent();
                    return [4 /*yield*/, fetchLintOutput(gitInfo.username, gitInfo.repo)];
                case 8:
                    correctness = _a.sent();
                    return [4 /*yield*/, fetchRepoIssues(gitInfo.username, gitInfo.repo)];
                case 9:
                    maintainer = _a.sent();
                    return [4 /*yield*/, fetchRepoPinning(gitInfo.username, gitInfo.repo)];
                case 10:
                    pinning = _a.sent();
                    return [4 /*yield*/, fetchRepoPullRequest(gitInfo.username, gitInfo.repo)];
                case 11:
                    pullRequest = _a.sent();
                    return [4 /*yield*/, calcTotalScore(busFactor, rampup, license, correctness, maintainer, pullRequest, pinning)];
                case 12:
                    score = _a.sent();
                    return [4 /*yield*/, logger_1.logger.info("Calculated score ".concat(score, "\n"))];
                case 13:
                    _a.sent();
                    return [2 /*return*/, { busFactor: busFactor.toFixed(5), rampup: rampup.toFixed(5), license: license.toFixed(5), correctness: correctness.toFixed(5), maintainer: maintainer.toFixed(5), pullRequest: pullRequest.toFixed(5), pinning: pinning.toFixed(5), score: score.toFixed(5) }];
                case 14:
                    error_1 = _a.sent();
                    //console.error(`Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get Metric info for ".concat(gitInfo.username, "/").concat(gitInfo.repo, "\n"))];
                case 15:
                    //console.error(`Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                    _a.sent();
                    return [3 /*break*/, 16];
                case 16:
                    i++;
                    return [3 /*break*/, 2];
                case 17: return [2 /*return*/];
            }
        });
    });
}
exports.get_metric_info = get_metric_info;
function outputResults(username, repo, busFactor, rampup, license, correctness, maintainer, pinning, pullRequest, score) {
    return __awaiter(this, void 0, void 0, function () {
        var url, repoData, ndJsonpath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://github.com/".concat(username, "/").concat(repo);
                    repoData = {
                        URL: url,
                        NET_SCORE: parseFloat(score.toFixed(5)),
                        RAMP_UP_SCORE: parseFloat(rampup.toFixed(5)),
                        CORRECTNESS_SCORE: parseFloat(correctness.toFixed(5)),
                        BUS_FACTOR_SCORE: parseFloat(busFactor.toFixed(5)),
                        LICENSE_SCORE: license,
                        GOOD_PINNING_PRACTICE: parseFloat(pinning.toFixed(5)),
                        PULL_REQUEST: parseFloat(pullRequest.toFixed(5)),
                        RESPONSIVE_MAINTAINER_SCORE: parseFloat(maintainer.toFixed(5)),
                    };
                    console.log(JSON.stringify(repoData));
                    ndJsonpath = "./results.ndjson";
                    return [4 /*yield*/, logger_1.logger.info(JSON.stringify(repoData) + "\n")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, logger_1.logger.info(JSON.stringify(repoData) + "\n")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////
// here we are getting everything we need for our metrics from the api  (contributors, license, readme, issues, etc)
function fetchRepoInfo(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_info, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}", {
                            owner: username,
                            repo: repo
                        })];
                case 1:
                    repo_info = _a.sent();
                    return [2 /*return*/, repo_info];
                case 2:
                    error_2 = _a.sent();
                    //console.error(`Failed to get repo info for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get repo info for ".concat(username, "/").concat(repo, "\n"))];
                case 3:
                    //console.error(`Failed to get repo info for ${username}/${repo}`);
                    _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoContributors(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_contributors, numberOfContributors, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, octokit.paginate("GET /repos/".concat(username, "/").concat(repo, "/contributors"), {
                            per_page: 100,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    repo_contributors = _a.sent();
                    numberOfContributors = repo_contributors.length;
                    return [2 /*return*/, calcuBusFactor(numberOfContributors)];
                case 2:
                    error_3 = _a.sent();
                    //console.error(`Failed to get repo contributors for ${username}/${repo} due to: `, error);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get repo contributors for ".concat(username, "/").concat(repo, "\n"))];
                case 3:
                    //console.error(`Failed to get repo contributors for ${username}/${repo} due to: `, error);
                    _a.sent();
                    return [2 /*return*/, 0];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoLicense(username, repo) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 7]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/license", {
                            owner: username,
                            repo: repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    response = _c.sent();
                    if (!(((_a = response.data.license) === null || _a === void 0 ? void 0 : _a.key) && (((_b = response.data.license) === null || _b === void 0 ? void 0 : _b.key) != "other"))) return [3 /*break*/, 2];
                    return [2 /*return*/, calcLicenseScore(response.data.license.name)];
                case 2: 
                //console.error(`No license found for ${username}/${repo}`);
                return [4 /*yield*/, logger_1.logger.info("No license found for ".concat(username, "/").concat(repo, "\r\nEither License not compatible with LGPLv2.1, or was not found in repo's license section.\n"))];
                case 3:
                    //console.error(`No license found for ${username}/${repo}`);
                    _c.sent();
                    return [2 /*return*/, 0];
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_4 = _c.sent();
                    //sconsole.error(`Failed to get repo license for ${username}/${repo}`, error);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get repo license for ".concat(username, "/").concat(repo, " from API\n"))];
                case 6:
                    //sconsole.error(`Failed to get repo license for ${username}/${repo}`, error);
                    _c.sent();
                    return [2 /*return*/, 0];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoReadme(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_readme, readme, test_1, size_kb, size_kb_int, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 6]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/readme", {
                            owner: username,
                            repo: repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    repo_readme = _a.sent();
                    readme = Buffer.from(repo_readme.data.content, 'base64').toString('utf8');
                    test_1 = readme.length;
                    size_kb = (test_1 / 1024).toFixed(2);
                    size_kb_int = parseInt(size_kb);
                    if (!(test_1 === 0)) return [3 /*break*/, 3];
                    //console.error(`Readme for ${username}/${repo}: No readme found`);
                    return [4 /*yield*/, logger_1.logger.info("Readme for ".concat(username, "/").concat(repo, ": No readme found\n"))];
                case 2:
                    //console.error(`Readme for ${username}/${repo}: No readme found`);
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, calcRampUpScore(size_kb_int)]; // calculate rampup time
                case 4:
                    error_5 = _a.sent();
                    //console.error(`Failed to get repo readme for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get repo readme for ".concat(username, "/").concat(repo, "\n"))];
                case 5:
                    //console.error(`Failed to get repo readme for ${username}/${repo}`);
                    _a.sent();
                    return [2 /*return*/, 0];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function fetchTsAndJsFiles(username, repo) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var limitFiles, charsAccumulated, filesCounted, repoInfo, defaultBranch, response, tsAndJsFiles, fileCount, dirPath, _i, tsAndJsFiles_1, file, fileResponse, fileContent, fileContentDecoded, length_1, fileName, error_6;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 13, , 15]);
                    limitFiles = 25000;
                    charsAccumulated = 0;
                    filesCounted = 0;
                    return [4 /*yield*/, fetchRepoInfo(username, repo)];
                case 1:
                    repoInfo = _d.sent();
                    defaultBranch = (_a = repoInfo === null || repoInfo === void 0 ? void 0 : repoInfo.data) === null || _a === void 0 ? void 0 : _a.default_branch;
                    if (!!defaultBranch) return [3 /*break*/, 3];
                    //console.error(`Failed to fetch default branch for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to fetch default branch for ".concat(username, "/").concat(repo, "\n"))];
                case 2:
                    //console.error(`Failed to fetch default branch for ${username}/${repo}`);
                    _d.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
                        owner: username,
                        repo: repo,
                        tree_sha: defaultBranch,
                        recursive: "1",
                        headers: {
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    })];
                case 4:
                    response = _d.sent();
                    tsAndJsFiles = response.data.tree.filter(function (file) {
                        var _a;
                        var eslintFiles = [
                            '.eslintrc',
                            '.eslintrc.js',
                            '.eslintrc.json',
                            '.eslintrc.yaml',
                            '.eslintrc.yml',
                            '.eslintignore',
                            '.commitlintrc.js'
                        ];
                        if (eslintFiles.includes(((_a = file.path) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || ''))
                            return false; // skip eslint files
                        return (file.type === "blob" && file.path && (file.path.endsWith(".ts") || file.path.endsWith(".js")));
                    });
                    fileCount = tsAndJsFiles.length;
                    dirPath = "./temp_linter_test/".concat(repo);
                    createLintDirs(username, repo);
                    _i = 0, tsAndJsFiles_1 = tsAndJsFiles;
                    _d.label = 5;
                case 5:
                    if (!(_i < tsAndJsFiles_1.length)) return [3 /*break*/, 12];
                    file = tsAndJsFiles_1[_i];
                    if (!(file.type === "blob" || file.type === "file")) return [3 /*break*/, 11];
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                            owner: username,
                            repo: repo,
                            path: (_b = file.path) !== null && _b !== void 0 ? _b : '',
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 6:
                    fileResponse = _d.sent();
                    if (!('content' in fileResponse.data)) return [3 /*break*/, 9];
                    fileContent = fileResponse.data.content;
                    fileContentDecoded = Buffer.from(fileContent, 'base64').toString('utf8');
                    length_1 = fileContentDecoded.length;
                    charsAccumulated += length_1;
                    if (length_1 === 0) {
                        return [3 /*break*/, 11]; // skip empty files and files less than 100 characters
                    }
                    fileName = (_c = file.path) === null || _c === void 0 ? void 0 : _c.split('/').pop();
                    if (!!fileName) return [3 /*break*/, 8];
                    //console.error(`Failed to get file name for ${username}/${repo}/${file.path}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get file name for ".concat(username, "/").concat(repo, "/").concat(file.path, "\n"))];
                case 7:
                    //console.error(`Failed to get file name for ${username}/${repo}/${file.path}`);
                    _d.sent();
                    return [3 /*break*/, 11];
                case 8:
                    filesCounted++;
                    if (charsAccumulated > limitFiles) {
                        return [3 /*break*/, 12];
                    }
                    return [3 /*break*/, 11];
                case 9: 
                //console.error(`Failed to get file content for ${username}/${repo}/${file.path}`);
                return [4 /*yield*/, logger_1.logger.info("Failed to get file content for ".concat(username, "/").concat(repo, "/").concat(file.path, "\n"))];
                case 10:
                    //console.error(`Failed to get file content for ${username}/${repo}/${file.path}`);
                    _d.sent();
                    _d.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 5];
                case 12: return [2 /*return*/, filesCounted];
                case 13:
                    error_6 = _d.sent();
                    //console.error(`Failed to fetch TS and JS files for ${username}/${repo}: ${error}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to fetch TS and JS files for ".concat(username, "/").concat(repo, "\n"))];
                case 14:
                    //console.error(`Failed to fetch TS and JS files for ${username}/${repo}: ${error}`);
                    _d.sent();
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function createLintDirs(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var appendRepo, subDir, esLintconfig, config, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logger_1.logger.info("Creating test linting directory for ".concat(username, "/").concat(repo, " ... \n"))];
                case 1:
                    _a.sent();
                    appendRepo = "/".concat(repo);
                    subDir = "./temp_linter_test".concat(appendRepo);
                    esLintconfig = "/* eslint-env node */\nmodule.exports = {\n    extends: ['eslint:recommended'],\n    \"parserOptions\": {\n        \"ecmaVersion\": 5,\n    },\n    \"overrides\": [\n        {\n            \"files\": [\"*.ts\", \"*.tsx\"],\n            \"parser\": \"@typescript-eslint/parser\",\n            \"plugins\": ['@typescript-eslint'],\n            \"extends\": [\n                \"plugin:@typescript-eslint/recommended\",\n            ],\n        }\n    ],\n    root: true,\n};\n    ";
                    config = esLintconfig.trim();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    fs.writeFileSync("".concat(subDir, "/.eslintrc.cjs"), config);
                    return [4 /*yield*/, logger_1.logger.info("Successfuly created test linting directory for ".concat(username, "/").concat(repo, " ... \n"))];
                case 3:
                    _a.sent();
                    return [2 /*return*/, 1];
                case 4:
                    e_1 = _a.sent();
                    return [4 /*yield*/, logger_1.logger.info("Failed to create test linting directory for ".concat(username, "/").concat(repo, "\n"))];
                case 5:
                    _a.sent();
                    return [2 /*return*/, e_1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function runEslint(directory) {
    return new Promise(function (resolve, reject) {
        exec("npx eslint ".concat(directory, " -o ").concat(directory, "/result.json"), { encoding: 'utf8' }, function (error, stdout, stderr) {
            if (error) {
                // Check if the error is due to linting issues
                if (error.code === 1) {
                    resolve(stdout); // if error is due to linting, it's not a "real" error for us
                }
                else {
                    reject(error);
                }
            }
            else {
                resolve(stdout);
            }
        });
    });
}
function fetchLintOutput(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var subDir, fileCount, errors, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subDir = "./temp_linter_test/".concat(repo);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 11]);
                    return [4 /*yield*/, fetchTsAndJsFiles(username, repo)];
                case 2:
                    fileCount = _a.sent();
                    if (!!fileCount) return [3 /*break*/, 4];
                    fileCount = 0;
                    //console.error(`No TS or JS files found for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("No TS or JS files found for ".concat(username, "/").concat(repo, "\n"))];
                case 3:
                    //console.error(`No TS or JS files found for ${username}/${repo}`);
                    _a.sent();
                    process.exit(1);
                    _a.label = 4;
                case 4: return [4 /*yield*/, runEslint(subDir)];
                case 5:
                    _a.sent();
                    if (!!fs.existsSync("".concat(subDir, "/result.json"))) return [3 /*break*/, 7];
                    //correctness = 1; // if we dont have a result.json file, we will assume the code is correct
                    return [4 /*yield*/, logger_1.logger.info("Calculating correctness (no result.json file): ".concat(0, "/").concat(fileCount, "\n"))];
                case 6:
                    //correctness = 1; // if we dont have a result.json file, we will assume the code is correct
                    _a.sent();
                    return [2 /*return*/, calcCorrectnessScore(0, fileCount)];
                case 7:
                    errors = getErrorAndWarningCount("".concat(subDir, "/result.json")).errors;
                    return [4 /*yield*/, logger_1.logger.info("Calculating correctness: ".concat(errors, "/").concat(fileCount, "\n"))];
                case 8:
                    _a.sent();
                    return [2 /*return*/, calcCorrectnessScore(errors, fileCount)];
                case 9:
                    error_7 = _a.sent();
                    //console.error(`Failed to get lint output for ${username}/${repo}: ${error}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get lint output for ".concat(username, "/").concat(repo, " : ").concat(error_7, "\n"))];
                case 10:
                    //console.error(`Failed to get lint output for ${username}/${repo}: ${error}`);
                    _a.sent();
                    return [2 /*return*/, 0];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function getErrorAndWarningCount(filepath) {
    var file = fs.readFileSync(filepath, 'utf8');
    var lines = file.trim().split('\n');
    for (var i = lines.length - 1; i >= 0; i--) {
        var line = lines[i];
        if (line.startsWith('✖')) {
            var errorMatch = line.match(/(\d+) error/);
            var errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
            return { errors: errors };
        }
    }
    return { errors: 0 };
}
function fetchRepoIssues(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var timeDifference_1, response, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 6]);
                    timeDifference_1 = [];
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/issues", {
                            owner: username,
                            repo: repo,
                            state: "all",
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28',
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!(response.data.length === 0)) return [3 /*break*/, 3];
                    //console.error(`No issues found for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("No issues found for ".concat(username, "/").concat(repo, "\n"))];
                case 2:
                    //console.error(`No issues found for ${username}/${repo}`);
                    _a.sent();
                    return [2 /*return*/, 0];
                case 3:
                    response.data.forEach(function (issue) {
                        var createdAt = new Date(issue.created_at);
                        var closedAt;
                        if (issue.closed_at) {
                            closedAt = new Date(issue.closed_at);
                            var difference = closedAt.valueOf() - createdAt.valueOf();
                            timeDifference_1.push(difference);
                        }
                        else {
                            closedAt = null;
                        }
                    });
                    return [2 /*return*/, calcRespMaintScore(timeDifference_1, username, repo)];
                case 4:
                    error_8 = _a.sent();
                    //console.error(`Failed to get issues for ${username}/${repo}`);
                    return [4 /*yield*/, logger_1.logger.info("Failed to get issues for ".concat(username, "/").concat(repo, "\n"))];
                case 5:
                    //console.error(`Failed to get issues for ${username}/${repo}`);
                    _a.sent();
                    return [2 /*return*/, 0];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoPinning(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var response, content, packageJson_1, totalPackages_1, nonPinnedPackages_1, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/contents/package.json', {
                            owner: username,
                            repo: repo,
                        })];
                case 1:
                    response = _a.sent();
                    content = Buffer.from(response.data.content, 'base64').toString('utf-8');
                    packageJson_1 = JSON.parse(content);
                    if (packageJson_1.dependencies) {
                        totalPackages_1 = 0;
                        nonPinnedPackages_1 = 0;
                        Object.keys(packageJson_1.dependencies).forEach(function (deps) {
                            var version = packageJson_1.dependencies[deps];
                            var regex = /^\d+(\.\d+){2}(\.[a-zA-Zx])?$/;
                            if (!regex.test(version)) {
                                nonPinnedPackages_1++;
                            }
                            totalPackages_1++;
                        });
                        //console.log(packageJson.dependencies);
                        return [2 /*return*/, nonPinnedPackages_1 / totalPackages_1];
                    }
                    else {
                        return [2 /*return*/, 1];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.error('Error occurred while fetching data:', error_9);
                    throw error_9;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoPullRequest(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var pullRequests, reviewedLines, totalLines, idx, _i, pullRequests_1, pr, files, _loop_1, _a, files_1, file, fraction, error_10;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, octokit.paginate("GET /repos/{owner}/{repo}/pulls", {
                            owner: username,
                            repo: repo,
                            state: "closed",
                        })];
                case 1:
                    pullRequests = _b.sent();
                    reviewedLines = 0;
                    totalLines = 0;
                    idx = 0;
                    _i = 0, pullRequests_1 = pullRequests;
                    _b.label = 2;
                case 2:
                    if (!(_i < pullRequests_1.length)) return [3 /*break*/, 9];
                    pr = pullRequests_1[_i];
                    if (idx > 50) {
                        return [3 /*break*/, 9];
                    }
                    if (!pr.merged_at) return [3 /*break*/, 7];
                    return [4 /*yield*/, octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
                            owner: username,
                            repo: repo,
                            pull_number: pr.number,
                        })];
                case 3:
                    files = _b.sent();
                    _loop_1 = function (file) {
                        var reviewComments, fileComments;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    totalLines += file.additions;
                                    return [4 /*yield*/, octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/comments", {
                                            owner: username,
                                            repo: repo,
                                            pull_number: pr.number,
                                        })];
                                case 1:
                                    reviewComments = _c.sent();
                                    fileComments = reviewComments.filter(function (comment) { return comment.path === file.filename; });
                                    if (fileComments.length > 0) {
                                        reviewedLines += file.additions;
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, files_1 = files;
                    _b.label = 4;
                case 4:
                    if (!(_a < files_1.length)) return [3 /*break*/, 7];
                    file = files_1[_a];
                    return [5 /*yield**/, _loop_1(file)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    idx++;
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9:
                    if (totalLines === 0) {
                        //console.log("No code changes found in the pull requests of the repository.");
                        return [2 /*return*/, 0];
                    }
                    else {
                        fraction = reviewedLines / totalLines;
                        //console.log(`Fraction of code introduced through reviewed pull requests: ${fraction}`);
                        return [2 /*return*/, fraction];
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_10 = _b.sent();
                    console.error("An error occurred while fetching data from GitHub API:", error_10);
                    return [2 /*return*/, 0];
                case 11: return [2 /*return*/];
            }
        });
    });
}
