#!/usr/bin/env node

var shell = require('shelljs');

const pjson = require('./package.json');

/* TODO: Ignore all fileDep modules, then enable in CI */
let ignoreModules = "";
Object.entries(pjson.fileDependencies).forEach(([key, value]) => {
    ignoreModules += `--ignore-module="${key}" `;
});

ignoreModules += ` --ignore-module="shelljs" --ignore-module="jsdoc" --ignore-module="mocha" --ignore-module="chai" --ignore-module="chai-iterator" `

shell.echo(`./package.json:`);
shell.exec(`dependency-check ./package.json"`);
shell.exec(`dependency-check ./package.json --unused --no-dev ${ignoreModules}`);
shell.echo(` `);
shell.echo(` `);

Object.entries(pjson.fileDependencies).forEach(([key, value]) => {
    shell.echo(`${value}package.json:`);
    shell.exec(`dependency-check ${value}package.json --entry index.js`);
    shell.exec(`dependency-check ${value}package.json --unused --entry index.js ${ignoreModules}`);
    shell.echo(` `);
    shell.echo(` `);
});
