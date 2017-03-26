// Configures yargs to use the command directory
const process = require('process');
const os = require('os');
const npid = require('npid');
const path = require('path');
const argv = require('yargs')
  .commandDir('commands')
  .demandCommand(1)
  .help()
  .argv;

//Returns a logger instance
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

// Manages startup Inexor Flex
// - only a single instance is allowed
// - on SIGINT a reload should be triggerd
// - on SIGTERM process is killed

var pid = null;

try {
  pid = npid.create(require('@inexor-game/path').pid_path);
  pid.removeOnExit(); // This does not sanely work
} catch (err) {
  log.error(err.message);
  process.exit(1);
}

process.on('SIGHUP', () => {
  switch (os.platform) {
    case 'win32':
      log.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
      pid.remove();
      process.exit();
      break;
    default:
      log.info('Got SIGHUP. Graceful reloading the server', new Date().toISOString())
      require('@inexor-game/plugins').then((router) => {
        app.use('/plugins', router);
      })
      break;
  }
});

process.on('SIGINT', () => {
  log.info('Got SIGINT. Graceful shutdown start', new Date().toISOString())
  pid.remove();
  process.exit();
});

process.on('SIGTERM', () => {
  log.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
  pid.remove();
  process.exit();
});

process.on('exit', (code) => {
  log.info('Got ' + code + ' and gracefully killed the server.', new Date().toISOString());
  pid.remove();
})

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
