//////////////////////////////////////////////////////////////////////
// now actual metric score calculations
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { logFilePath, logLevel } from './main';
import * as fs from 'fs';
import { createLintDirs, fetchRepoContributors, fetchRepoLicense, fetchRepoReadme, fetchLintOutput, fetchRepoIssues, fetchRepoPinning, fetchRepoPullRequest } from './metric_helpers';
function calcuBusFactor(x) {
    const result = (Math.pow((Math.log(x + 1) / (Math.log(1500 + 1))), 1.22));
    //console.log(`Bus Factor: ${result}`);
    return result;
}
function calcRampUpScore(x) {
    const result = (1 - (Math.pow((Math.log(x + 1) / (Math.log(105906 + 1))), 1.22)));
    //console.log(`Ramp Up: ${result}`);
    return result;
}
function calcLicenseScore(licenseName) {
    let licenseScore = 0;
    const lowercaseLicense = licenseName.toLowerCase();
    if (lowercaseLicense.includes('apache') || lowercaseLicense.includes('mit') || lowercaseLicense.includes('gpl') || lowercaseLicense.includes('bsd')) {
        licenseScore = 1;
    }
    return licenseScore;
}
function calcCorrectnessScore(errors, filecount) {
    // lets get the errors/warnings per file
    // we really only care about errors
    const errorsPerFile = errors / filecount;
    let scaledError = 0;
    let correctnessScore = 0;
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
    const sum = timeDifference.reduce((acc, value) => acc + value, 0);
    const avg = sum / timeDifference.length;
    let maintainer = (1 - (avg / (86400000 * 30)));
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
    return __awaiter(this, void 0, void 0, function* () {
        /*
        Sarah highest priority is is not enough maintainers, we tie this into the responsive maintainer score
        responsive ^
        bus factor
            important as we dont want package to die when one person leaves
        ramp up
            she explicitly wants a good ramp up score so engineers can work with the package easier
        */
        const busWeight = 0.10;
        const rampupWeight = 0.10;
        const respMaintWeight = 0.30;
        const correctnessWeight = 0.30;
        const pinningWeight = 0.10;
        const pullRequestWeight = 0.10;
        const busScore = busFactor * busWeight;
        const rampupScore = rampup * rampupWeight;
        const respMaintScore = maintainer * respMaintWeight;
        const correctnessScore = correctness * correctnessWeight;
        const pinningScore = pinning * pinningWeight;
        const pullRequestScore = pullRequest * pullRequestWeight;
        const score = license * (busScore + rampupScore + respMaintScore + correctnessScore + pinningScore + pullRequestScore);
        //console.log(`Total Score: ${score.toFixed(5)}`); // can allow more or less decimal, five for now
        return score;
    });
}
function get_metric_info(gitDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < gitDetails.length; i++) {
            const gitInfo = gitDetails[i];
            try {
                //console.log(`Getting Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
                yield createLintDirs(gitInfo.username, gitInfo.repo);
                const busFactor = yield fetchRepoContributors(gitInfo.username, gitInfo.repo);
                const license = yield fetchRepoLicense(gitInfo.username, gitInfo.repo);
                const rampup = yield fetchRepoReadme(gitInfo.username, gitInfo.repo);
                const correctness = yield fetchLintOutput(gitInfo.username, gitInfo.repo);
                const maintainer = yield fetchRepoIssues(gitInfo.username, gitInfo.repo);
                const pinning = yield fetchRepoPinning(gitInfo.username, gitInfo.repo);
                const pullRequest = yield fetchRepoPullRequest(gitInfo.username, gitInfo.repo);
                console.log(pullRequest);
                let score = yield calcTotalScore(busFactor, rampup, license, correctness, maintainer, pullRequest, pinning);
                outputResults(gitInfo.username, gitInfo.repo, busFactor, rampup, license, correctness, maintainer, pinning, pullRequest, score);
                //console.log(`~~~~~~~~~~~~~~~~\n`);
            }
            catch (error) {
                //console.error(`Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}`);
                if (logLevel == 2) {
                    fs.appendFile(logFilePath, `Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}\n`, (err) => { });
                }
            }
        }
    });
}
function outputResults(username, repo, busFactor, rampup, license, correctness, maintainer, pinning, pullRequest, score) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://github.com/${username}/${repo}`;
        const repoData = {
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
        const ndJsonpath = `./results.ndjson`;
        fs.appendFileSync(ndJsonpath, JSON.stringify(repoData) + "\n");
        if (logLevel >= 1) {
            fs.appendFileSync(logFilePath, JSON.stringify(repoData) + "\n");
        }
    });
}
export { calcuBusFactor, calcLicenseScore, calcRampUpScore, calcCorrectnessScore, calcRespMaintScore, get_metric_info, outputResults, calcTotalScore, };
