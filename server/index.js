// Configures yargs to use the command directory
const argv = require('yargs')
  .commandDir('commands')
  .help()
  .argv

// Pull the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const tree = require('@inexor-game/tree');
const connector = require('@inexor-game/connector');
const manager = require('@inexor-game/manager');
// const plugins = require('@inexor-game/plugins');

// Set's the executable path for all instances
global.binary_path = require('./util/core_path')

// Returns a logger instance
var log = require('./util/logger')(argv.console, argv.file, argv.level)

// Configures the server to be use-able as a RESTfull API
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static(argv.webdir));

// Configure the routes
var router = express.Router()

// Fire in the hole!
app.use('/api', router);

app.listen(argv.port, () => {
  log.info('Inexor Flex is listening on ' + argv.port)
})
