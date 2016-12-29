/**
 * @module @inexor-game/rest
 * This is a solely virtual module, for documentation purposes
 *
 */

const process = require('process');
const express = require('express');
const bodyParser = require('body-parser');

// Pull the inexor dependencies
const tree = require('@inexor-game/tree');
const manager = require('@inexor-game/manager');
const connector = require('@inexor-game/connector');
// const configurator = require('@inexor-game/configurator');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

var root = new tree.Root();

// Lists all available instances
router.get('/instance', (req, res) => {
  let instances = root.findNode('/instance')
  res.json(str(instances));
})

// Lists information about a given instance or raises a NonFoundError
router.get('/instance/:id/', (req, res) => {
  if (root.contains('/instance/' + req.id)) {
    res.status(500).send('Instance with id ' + req.id + ' was not found');
  } else {
    let instance = root.findNode('/instance/' + req.id);
    res.json(str(instance));
  }
})

// Creates an instance and inserts it into the tree. Returns the instance object, otherwise raises an error.
router.post('/instance/create', (req, res) => {

})

// Starts an instance with :id. Returns the started instance or raises an error.
router.get('/instance/:id/start', (req, res)  => {

})

// Stops an instance with :id. Returns the stoped instance or raises an error.
router.get('/instance/:id/stop', (req, res)  => {

})

// Connects an instance with :id to Inexor Core. Returns the connected instance or raises an error.
router.get('/instance/:id/connect', (req, res) => {

})

// Synchronizes an instance with Inexor Core. Returns the synchronized instance or raises an error.
router.get('/instance/:id/synchronize', (req, res) => {

})

// Set and get keys from instance/id's tree.
router.get('/tree/:id/:key/', (req, res) => {

})

router.post('/tree/:id/:key', (req, res) => {

})

// Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
router.get('/tree/:id/configure', (req, res) => {

})

module.exports = router;
