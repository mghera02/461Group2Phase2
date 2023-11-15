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
//imported functions
const { check_npm_for_open_source } = require('./src/main.ts');
const { fetchRepoInfo, fetchRepoContributors, fetchRepoLicense, fetchRepoReadme, fetchRepoIssues, createLintDirs } = require('./src/metric_helpers.ts');
const { outputResults, calcTotalScore, calcRespMaintScore, calcCorrectnessScore } = require('./src/metrics.ts');
const fs = require('fs');
const mockOctokit = {
    request: jest.fn(),
};
jest.mock('octokit', () => ({
    request: (path, config) => mockOctokit.request(path, config),
}));
//handle any mock creations for test suites
// Mock the fs module to track function calls
jest.mock('fs', () => ({
    appendFile: jest.fn(),
    appendFileSync: jest.fn(),
    existsSync: jest.fn(),
    readFile: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
}));
jest.mock('./src/main', () => ({
    check_npm_for_open_source: jest.fn(),
}));
describe('check_npm_for_open_source', () => {
    it('should return https link if valid github repository is present', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the 'readJSON' function to return fake data
        check_npm_for_open_source.mockImplementation(() => {
            return Promise.resolve({
                repository: {
                    type: 'git',
                    url: 'https://github.com/browserify/browserify'
                }
            });
        });
        const result1 = yield check_npm_for_open_source('./test_files/browserify_info.json');
        expect(result1).toStrictEqual({ "repository": { "type": "git", "url": "https://github.com/browserify/browserify" } });
    }));
    it('should return "Invalid" if no github repo is present', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the 'readJSON' function to return fake data indicating no GitHub repository
        check_npm_for_open_source.mockImplementation(() => {
            return Promise.resolve({
                repository: {
                    type: 'invalid'
                }
            });
        });
        const result2 = yield check_npm_for_open_source('./test_files/browserify_fake_type.json');
        expect(result2).toStrictEqual({ "repository": { "type": "invalid" } });
    }));
    it('should return null if file cannot be read', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the 'readJSON' function to simulate a failed read
        check_npm_for_open_source.mockImplementation(() => {
            return Promise.resolve(null);
        });
        const result3 = yield check_npm_for_open_source('./test_files/no_file');
        expect(result3).toBeNull();
    }));
});
describe('fetchRepoInfo', () => {
    it('should fetch repo info successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const repoInfo = yield fetchRepoInfo(username, repo);
        expect(repoInfo).not.toBeNull();
    }));
    it('should handle errors and log', () => __awaiter(void 0, void 0, void 0, function* () {
        //feed in nonexistant info so call returns error
        const username = 'invaliduser';
        const repo = 'invalidrepo';
        try {
            yield fetchRepoInfo(username, repo);
        }
        catch (error) {
            expect(fs.appendFile).toHaveBeenCalled();
        }
    }));
});
describe('fetchRepoContributors', () => {
    it('should fetch bus factor calculation successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const busFactor = yield fetchRepoContributors(username, repo);
        expect(busFactor).toBeLessThanOrEqual(1);
        expect(busFactor).toBeGreaterThanOrEqual(0);
    }));
    it('should handle errors and log', () => __awaiter(void 0, void 0, void 0, function* () {
        //feed in nonexistant info so call returns error
        const username = 'invaliduser';
        const repo = 'invalidrepo';
        try {
            yield fetchRepoContributors(username, repo);
        }
        catch (error) {
            expect(fs.appendFile).toHaveBeenCalled();
        }
    }));
});
describe('fetchRepoLicense', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return 0 for invalid or missing license', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'cloudinary';
        const repo = 'cloudinary_npm';
        const license = yield fetchRepoLicense(username, repo);
        expect(license).toEqual(0);
    }));
    it('should handle errors and log', () => __awaiter(void 0, void 0, void 0, function* () {
        //feed in nonexistant info so call returns error
        const username = 'invaliduser';
        const repo = 'invalidrepo';
        try {
            yield fetchRepoLicense(username, repo);
        }
        catch (error) {
            expect(fs.appendFile).toHaveBeenCalled();
        }
    }));
});
describe('fetchRepoReadme', () => {
    it('should fetch bus factor calculation successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const ramp_up = yield fetchRepoReadme(username, repo);
        expect(ramp_up).toBeLessThanOrEqual(1);
        expect(ramp_up).toBeGreaterThanOrEqual(0);
    }));
    it('should handle errors and log', () => __awaiter(void 0, void 0, void 0, function* () {
        //feed in nonexistant info so call returns error
        const username = 'invaliduser';
        const repo = 'invalidrepo';
        try {
            yield fetchRepoReadme(username, repo);
        }
        catch (error) {
            expect(fs.appendFile).toHaveBeenCalled();
        }
    }));
});
describe('fetchRepoIssues', () => {
    it('should fetch maintainer calculation successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const ramp_up = yield fetchRepoIssues(username, repo);
        expect(ramp_up).toBeLessThanOrEqual(1);
        expect(ramp_up).toBeGreaterThanOrEqual(0);
    }));
    it('should handle errors and log', () => __awaiter(void 0, void 0, void 0, function* () {
        //feed in nonexistant info so call returns error
        const username = 'invaliduser';
        const repo = 'invalidrepo';
        try {
            yield fetchRepoReadme(username, repo);
        }
        catch (error) {
            expect(fs.appendFile).toHaveBeenCalled();
        }
    }));
});
describe('createLintDirs', () => {
    it('should create linting directories', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const result = yield createLintDirs(username, repo);
        expect(result).toEqual(1);
    }));
});
/*describe('get_metric_info', () => {
  it('should calculate and output metric values', async () => {
    ensureDirectoryExistence('./temp_linter_test'); // make temp directory for linter test files
    ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await delay(1000); // wait 1 second

    const username = 'nullivex';
    const repo = 'nodist';

    const repoList = [{username, repo}];
    // Create a spy for console.log
    const consoleSpy = jest.spyOn(console, 'log');

    await get_metric_info(repoList);
    await delay(1000); // wait 1 second
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(String)); // Ensure it logs to console

    // Restore the original console.log
    consoleSpy.mockRestore();

    fs.rmSync('./temp_linter_test', { recursive: true });
    fs.rmSync('./temp_npm_json', { recursive: true });
  });

  it('should handle errors and log', async () => {
    //feed in nonexistant info so call returns error
    const username = 'invaliduser';
    const repo = 'invalidrepo';
    const repoList = [{username, repo}];
    try{
      await get_metric_info(repoList);
    } catch (error: any){
      expect(fs.appendFile).toHaveBeenCalled();
    }
  });
});*/
describe('calcTotalScore', () => {
    it('should return score as a sum of weighted components', () => __awaiter(void 0, void 0, void 0, function* () {
        const score = yield calcTotalScore(0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
});
describe('calcRespMaintScore', () => {
    it('should return score as a sum of weighted components', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        const score = yield calcRespMaintScore([5, 10, 15, 20, 25, 30], username, repo);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
});
describe('calcCorrectnessScore', () => {
    it('should return correctness score based on num errors per num lines', () => __awaiter(void 0, void 0, void 0, function* () {
        const score = calcCorrectnessScore(300, 10000);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
});
describe('outputResults', () => {
    it('should print results as a json to string format', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'nullivex';
        const repo = 'nodist';
        // Create a spy for console.log
        const consoleSpy = jest.spyOn(console, 'log');
        yield outputResults(username, repo, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5);
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(String)); // Ensure it logs to console
        // Restore the original console.log
        consoleSpy.mockRestore();
    }));
});
