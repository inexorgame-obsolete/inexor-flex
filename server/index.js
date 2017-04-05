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
  .option('port', {
    default: 31416,
    type: 'number',
    describe: 'The server port to use.'
  })
  .option('host', {
    default: 'localhost',
    type: 'string',
    describe: 'The hostname to listen on.'
  })
  .option('webdir', {
    // TODO: handle multiple user interfaces
    default: 'interfaces/',
    type: 'string',
    describe: 'The path to the Inexor user interfaces.'
  })
  .option('console', {
    default: true,
    type: 'boolean',
    describe: 'If true, the Inexor Flex webserver logs to console'
  })
  .option('file', {
    default: null,
    type: 'string',
    describe: 'Sets the log file of the Inexor Flex webserver.'
  })
  .option('level', {
    default: 'info',
    type: 'string',
    describe: 'Sets the log level of the Inexor Flex webserver.'
  })
  .help()
  .epilogue('https://inexor.org/')
  .argv;

// Returns a logger instance
var log = inexor_logger('@inexor-game/flex/server', argv.console, argv.file, argv.level);

log.debug(util.format('Using command line options:\n%s', JSON.stringify(argv, undefined, 2)));

// Pull the dependencies
const express = require('express');

// Configures the server to be use-able as a RESTfull API
var app = express();

// Use the webdir via the --webdir flag
try {
  app.use(express.static(path.resolve(argv.webdir)));
  log.debug(util.format('Using webdir: %s', argv.webdir));
} catch (err) {
  log.warn('Skipped webdir');
}

// Handle logging
app.use((req, res, next) => {
  log.info('Called route ' + req.path);
  next();
});

// Handle errors
app.use((err, req, res, next) => {
  log.error(err);
  next(err);
});

// Manages startup of Inexor Flex
// - only a single instance is allowed
// - on SIGHUP a reload should be triggered (excluding win32)
// - on SIGINT and SIGTERM process is killed

var pid = null;

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

process.on('SIGHUP', () => {
  switch(os.platform()) {
    case 'win32':
      // Different behavior on windows: closing a CMD window
      log.info('Got signal SIGHUP. Graceful shutdown');
      if(!pid.remove()) {
        log.error("Exit: Not been able to remove the PID file, remove it manually: " + inexor_path.pid_path);
      }
      process.exit();
      break;
    default:
      log.info(util.format('Got signal SIGHUP. Graceful reloading the server (%s)', os.platform()));
      require('@inexor-game/plugins').then((router) => {
        app.use('/plugins', router);
      });
      break;
  }
});

process.on('SIGINT', () => {
  log.info('Got signal SIGINT. Graceful shutdown');
  if(!pid.remove()) {
    log.error("Exit: Not been able to remove the PID file, remove it manually: " + inexor_path.pid_path);
  }
  process.exit();
});

process.on('SIGTERM', () => {
  log.info('Got signal SIGTERM. Graceful shutdown');
  if(!pid.remove()) {
    log.error("Exit: Not been able to remove the PID file, remove it manually: " + inexor_path.pid_path);
  }
  process.exit();
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
  log.error(util.format("Crash in native module (signal %s, address %s)", signal, address));
  log.error(stack);
  if(!pid.remove()) {
    log.error("Exit: Not been able to remove the PID file, remove it manually: " + inexor_path.pid_path);
  }
  process.exit(1);
});

// Require the router from the rest module
var api = require('@inexor-game/api').v1;
// Require the router from the plugins module
require('@inexor-game/plugins').then((router) => {
  app.use('/plugins/', router);
}).catch((err) => {
  log.error(err);
});

// Fire in the hole!
// This is assembled before runtime
app.use('/api/v1/', api);

var server = app.listen(argv.port, (err) => {
  if (err) {
    log.error(err, 'Failed to start Inexor Flex');
    pid.remove();
    process.exit();
  } else {
    log.info('Inexor Flex is listening on ' + argv.port);
  }
});
