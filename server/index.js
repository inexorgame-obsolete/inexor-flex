// Configures yargs to use the command directory
const npid = require('npid');
const os = require('os');
const path = require('path');
const process = require('process');
const segfaultHandler = require('segfault-handler');
const util = require('util');
const fs = require('fs');
const argv = require('yargs')
  .commandDir('commands')
  .demandCommand(1)
  .help()
  .argv;

const inexor_path = require('@inexor-game/path');

// Returns a logger instance
var log = require('@inexor-game/logger')(argv.console, argv.file, argv.level);

// Pull the dependencies
const express = require('express');

// Configures the server to be use-able as a RESTfull API
var app = express();

// Use the webdir via the --webdir flag
app.use(express.static(path.resolve(argv.webdir)));

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
// - on SIGHUP a reload should be triggered (unix)
// - on SIGINT and SIGTERM process is killed

var pid = null;

try {
  if(fs.existsSync(inexor_path.pid_path))
  {
    var current_pid = new Buffer(process.pid + '\n');
    var pid_file_contents = fs.readFileSync(inexor_path.pid_path,'utf8');
    if(current_pid != pid_file_contents)
    {
      log.warn('PID file had existed already but no fitting process has been found. Continuing..');
      log.warn('(old PID: ' + pid_file_contents + 'current PID: ' + current_pid + ')');
      pid = npid.create(inexor_path.pid_path, true);
    }
    else throw new Error('Another instance of Flex is already running.');
  }
  else pid = npid.create(inexor_path.pid_path);
} catch (err) {
  log.error('Could not create pid file ' + inexor_path.pid_path);
  log.error(err.message);
  process.exit(1);
}

process.on('SIGHUP', () => {
  switch (os.platform) {
    case 'win32':
      // Different behavior on windows: closing a CMD window
      log.info('Got signal SIGHUP. Graceful shutdown');
      pid.remove();
      process.exit();
      break;
    default:
      log.info('Got signal SIGHUP. Graceful reloading the server');
      require('@inexor-game/plugins').then((router) => {
        app.use('/plugins', router);
      });
      break;
  }
});

process.on('SIGINT', () => {
  log.info('Got signal SIGINT. Graceful shutdown');
  pid.remove();
  process.exit();
});

process.on('SIGTERM', () => {
  log.info('Got signal SIGTERM. Graceful shutdown');
  pid.remove();
  process.exit();
});

process.on('exit', (code, signal) => {
  if (code != null) {
    log.info(util.format('Inexor Flex process exited with exit code %d', code));
  } else if (signal != null) {
    log.info(util.format('Inexor Flex process exited with signal %s', signal));
  }
  pid.remove();
});

// We override the default handler since we want our pid file removed in any case.
process.on('uncaughtException', function(err) {
  log.error(util.format("%s uncaughtException: %s", (new Date()).toUTCString(), err.message));
  log.error(err.stack);
  pid.remove();
  process.exit(1);
});

// segfaultHandler is used for handling crashes in native C/C++ node modules.
segfaultHandler.registerHandler('crash.log', function(signal, address, stack) {
  pid.remove();  // This does not work..

  log.error(util.format("Crash in native module (signal %s, address %s)", signal, address));
  log.error(stack);
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
app.use('/api/v1/', api); // This is assembled before runtime

var server = app.listen(argv.port, (err) => {
  if (err) {
    log.error(err);
    pid.remove();
    process.exit();
  } else {
    log.info('Inexor Flex is listening on ' + argv.port);
  }
});
