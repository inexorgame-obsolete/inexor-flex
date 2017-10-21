#!/usr/bin/env node
const process = require('process');
const fs = require('fs');
const yargs = require('yargs');

const child_process = require('child_process');
const wait_on = require('wait-on');
const util = require('util');
const path = require('path');
const inexor_path = require('@inexorgame/path');
const log = require('@inexorgame/logger')();

// Convert URL to command line parameters if necessary
if (process.argv.length == 3 && process.argv[2].startsWith('inexor:')) {
  // Convert the URL starting with 'inexor:' to command line arguments
  process.argv = process.argv.slice(0, 2).concat(process.argv[2].substr(7).split(' '));
}

let serverDir = path.join(__dirname, 'server');
log.debug(`The server dir is at ${serverDir}`);

const hostname = 'localhost' // This will comfort >90% of our users
const pid_path = path.join(inexor_path.pid_path, util.format('flex.%s.%s.pid', hostname, inexor_path.DEFAULT_PORT));
log.debug(`Checking wether the flex pid exists at ${pid_path} exists`)

if (!fs.existsSync(pid_path)) {
  log.warn('Inexor Flex is not running! Starting Inexor Flex...');
  // Starting Inexor Flex detached without stdio
  let serverPath = path.join(serverDir, 'index.js');
  log.debug(`Trying to start the server via ${serverPath}`)

  const child = child_process.spawn('npm', [
    'start'
  ], {
    detached: true,
    stdio: 'inherit',
    cwd: __dirname // Ensures stuff to run correctly,
  });
  child.unref();
}

// Wait until PID is available
wait_on({
  resources: [ pid_path ],
  delay: 0,
  interval: 25,
  window: 50,
  timeout: 10000
}, function (err) {
  if (err) {
    log.error('Inexor Flex didn\'t came up:');
    log.error(err);
  } else {
    if (process.argv.length >= 3 && process.argv[2].trim() == 'shell') {
      const argv = yargs // eslint-disable-line no-unused-vars
        .commandDir(path.join(serverDir, 'commands'))
        .demandCommand(1)
        .help()
        .argv;
    } else {
      const argv = yargs // eslint-disable-line no-unused-vars
        .commandDir(path.join(serverDir, 'commands/cli'))
        .command('shell', 'Opens an interactive shell')
        .demandCommand(1)
        .help()
        .argv;
    }
  }
});
