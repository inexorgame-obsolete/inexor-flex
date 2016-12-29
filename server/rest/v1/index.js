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

router.get('/instance', (req, res) => {
  let instances = root.findNode('/instance')
  res.json(str(instances));
})

router.get('/instance/:id/', (req, res) => {
  let instance = root.findNode('/instance/' + req.id);
  if (instance == null) {
    res.status(500).send('Instance with id ' + req.id + ' was not found');
  } else {
    res.json(str(instance));
  }
})

router.post('/instance/create', (req, res) => {

})

router.get('/instance/:id/start', (req, res)  => {

})

router.get('/instance/:id/stop', (req, res)  => {

})

module.exports = router;
