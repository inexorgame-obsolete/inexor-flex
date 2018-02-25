#!/usr/bin/env node

const pjson = require('./package.json');
var shell = require('shelljs');

const rootDir = __dirname;

Object.entries(pjson.fileDependencies).forEach(([key, value]) => {
    if (shell.exec(`cd ${value} && yarn install && yarn link && cd ${rootDir} && yarn link ${key}`).code !== 0) {
        shell.echo('Error: Postinstall failed');
        shell.exit(1);
    }
});
