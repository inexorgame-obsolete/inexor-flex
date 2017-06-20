#!/usr/bin/env node

const fs = require('fs');
const npid = require('npid');
const os = require('os');
const path = require('path');
const process = require('process');
const segfaultHandler = require('segfault-handler');
const util = require('util');

const inexor_path = require('@inexor-game/path');
const inexor_logger = require('@inexor-game/logger');

const argv = require('yargs')
  .option('profile', {
    default: null,
    type: 'string',
    describe: 'Sets the profile to use.'
  })
  .option('hostname', {
    default: null,
    type: 'string',
    describe: 'The hostname to listen on. Overwrites the profile value.'
  })
  .option('port', {
    default: null,
    type: 'number',
    describe: 'The server port to use. Overwrites the profile value.'
  })
  // TODO: manage logging by LogManager (uses profiles)
  .option('console', {
    default: true,
    type: 'boolean',
    describe: 'If true, the Inexor Flex webserver logs to console'
  })
  // TODO: manage logging by LogManager (uses profiles)
  .option('file', {
    default: null,
    type: 'string',
    describe: 'Sets the log file of the Inexor Flex webserver.'
  })
  // TODO: manage logging by LogManager (uses profiles)
  .option('level', {
    default: 'info',
    type: 'string',
    describe: 'Sets the log level of the Inexor Flex webserver.'
  })
  .option('ignorepid', {
    default: false,
    type: 'boolean',
    describe: 'Ignores the PID file.'
  })
  .help()
  .epilogue('https://inexor.org/')
  .argv;

// Set process title
process.title = 'inexor';

// Returns a logger instance
var log = inexor_logger('@inexor-game/flex/server', argv.console, argv.file, argv.level);

log.debug(util.format('Using command line options:\n%s', JSON.stringify(argv, undefined, 2)));

// Pull the dependencies
const express = require('express');

// Configures the server to be use-able as a RESTfull API
var app = express();
app.use(require('cors')());

// Handle logging
app.use((req, res, next) => {
  log.info(util.format('[%s] %s -- %s (%s)', req.method, req.originalUrl, req.hostname, req.ip));
  next();
});

// Handle errors
app.use((err, req, res, next) => {
  log.error(err);
  next(err);
});

// Manages startup of Inexor Flex
// - only a single instance is allowed
// - a PID file is created or the application refuses to start

var pid = null;
if (!argv.ignorepid) {
  try {
    log.debug(util.format('Trying to create PID file: %s', inexor_path.pid_path));
    pid = npid.create(inexor_path.pid_path);
    // We also remove the PID file on SIGHUP, SIGINT and SIGTERM
    pid.removeOnExit();
    log.debug(util.format('PID file %s has been created successfully!', inexor_path.pid_path));
  } catch (err) {
    log.fatal(util.format('Could not create pid file %s: %s', inexor_path.pid_path, err.message));
    process.exit(1);
  }
}

// Exit handlers
// - on SIGHUP a reload is triggered (excluding win32, which exits)
// - on SIGINT and SIGTERM the process is killed and the PID file is removed
// - on exiting, a message is printed about the exit code or signal
// - we cannot handle SIGKILL, in this case the PID file cannot be removed cleanly

process.on('SIGHUP', () => {
  switch(os.platform()) {
    case 'win32':
      // Different behavior on windows: closing a CMD window
      log.info('Got signal SIGHUP. Graceful shutdown');
      if (pid != null && !pid.remove()) {
        log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
      } else {
        log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
      }
      process.exit();
      break;
    default:
      log.info(util.format('Got signal SIGHUP. Graceful reloading the server (%s)', os.platform()));
      // TODO: remove
      require('@inexor-game/plugins').then((router) => {
        app.use('/plugins', router);
      });
      break;
  }
});

process.on('SIGINT', () => {
  log.info('Got signal SIGINT. Graceful shutdown');
  if (pid != null && !pid.remove()) {
    log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
  } else {
    log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
  }
  process.exit();
});

process.on('SIGTERM', () => {
  log.info('Got signal SIGTERM. Graceful shutdown');
  if (pid != null && !pid.remove()) {
    log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
  } else {
    log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
  }
  process.exit();
});

process.on('uncaughtException', (err) => {
  log.info(err);
});

process.on('exit', (code, signal) => {
  if (code != null) {
    log.info(util.format('Inexor Flex process exited with exit code %d', code));
  } else if (signal != null) {
    log.info(util.format('Inexor Flex process exited with signal %s', signal));
  }
});

// segfaultHandler is used for handling crashes in native C/C++ node modules.
segfaultHandler.registerHandler('crash.log', function(signal, address, stack) {
  log.fatal(util.format("Crash in native module (signal %s, address %s)", signal, address));
  log.fatal(stack);
  if (pid != null && !pid.remove()) {
    log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
  } else {
    log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
  }
  process.exit(1);
});

// Require the router from the rest module
var api = require('@inexor-game/api').v1(argv);

// Fire in the hole!
// This is assembled before runtime
app.use('/api/v1/', api.get('router'));

let profileManager = api.get('profileManager');
// profileManager.setCurrentProfile(argv.profile);

let currentProfile = profileManager.getCurrentProfile();
let hostname = argv.hostname != null ? argv.hostname : currentProfile.hostname;
let port = argv.port != null ? argv.port : currentProfile.port;

var server = app.listen(port, hostname, (err) => {
  if (err) {
    log.error(err, 'Failed to start Inexor Flex');
    if (pid != null && !pid.remove()) {
      log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
    } else {
      log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
    }
    process.exit();
  } else {
    // The webserver and the service level are ready
    log.info(util.format('Inexor Flex is listening on http://%s:%s', hostname, port));
    // Finally load and start the Inexor Core instances
    api.get('instanceManager').loadInstances();
  }
});
