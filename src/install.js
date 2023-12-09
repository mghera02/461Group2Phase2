"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This file contains the code to install the dependencies
var child_process_1 = require("child_process");
var dependencies = ["octokit",
    "--save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint",
    "--save dotenv @types/dotenv --save-dev"];
for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
    var pkg = dependencies_1[_i];
    try {
        (0, child_process_1.execSync)("npm install ".concat(pkg));
    }
    catch (_a) {
        //console.error(`Error installing dependency ${pkg}`);
        console.error("Error: unable to install dependency ".concat(pkg));
        process.exit(1);
    }
}
