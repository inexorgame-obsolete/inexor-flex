#!/usr/bin/env node

const pjson = require('./package.json');
var shell = require('shelljs');

const rootDir = __dirname;

Object.entries(pjson.fileDependencies).forEach(([key, value]) => {
    if (shell.exec(`cd ${value} && yarn remove && yarn unlink && cd ${rootDir} && yarn unlink ${key}`).code !== 0) {
        shell.echo('Error: Preuninstall failed');
        shell.exit(1);
    }
});
