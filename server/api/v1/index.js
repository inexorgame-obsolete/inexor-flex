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
  if (!tree.contains('/instance')) {
    tree.addChild('/instance', 'node');
  }
  let instances = root.findNode('/instance')
  res.json(String(instances));
})

// Lists information about a given instance or raises a NonFoundError
router.get('/instance/:id/', (req, res) => {
  if (root.contains('/instance/' + req.params.id)) {
    res.status(500).send('Instance with id ' + req.params.id + ' was not found');
  } else {
    let instance = root.findNode('/instance/' + req.params.id).get();
    res.json(String(instance));
  }
})

// Creates an instance and inserts it into the tree. Returns the instance object, otherwise raises an error.
router.post('/instance/create', (req, res) => {
  if (body.args == null) {
    res.status(500).send('Instance can not be created without command line arguments.');
  } else {
    manager.create(body.args, body.identifier, body.port).then((instance) => {
      instance.tree = new tree.Root();
      tree.findNode('/instance').addChild(instance.id, 'node', instance);
    }).catch((err) {
      res.status(500).send(err);
    })
  }
})

// Starts an instance with :id. Returns the started instance or raises an error.
router.get('/instance/:id/start', (req, res)  => {
  if (tree.contains('/instance/' + req.params.id)) {
    let instance = tree.findNode('/instance').getChild(req.params.id);
    manager.start(instance).then((i) => {
      instance.set(i);
      res.json(String(i));
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Stops an instance with :id. Returns the stoped instance or raises an error.
router.get('/instance/:id/stop', (req, res)  => {
  if (tree.contains('/instance/' + req.params.id)) {
    let instance = tree.findNode('/instance').getChild(req.params.id);
    manager.stop(instance).then((i) => {
      instance.set(i);
      res.json(String(i));
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Connects an instance with :id to Inexor Core. Returns the connected instance or raises an error.
router.get('/instance/:id/connect', (req, res) => {
  if (tree.contains('/instance/' + req.params.id)) {
    let instance = tree.findNode('/instance').getChild(req.params.id);
    let connector = new Connector(instance.port, instance.tree);

    try {
      connector.connect();
      instance._connector = connector; // Usefull for synchronization
      res.json(String(instance));
    } catch (err) {
      res.status(500).send(err);
    }

  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Synchronizes an instance with Inexor Core. Returns the synchronized instance or raises an error.
router.get('/instance/:id/synchronize', (req, res) => {
  if (tree.contains('/instance/' + req.params.id)) {
    let instance = tree.findNode('/instance').getChild(req.params.id);

    if (instance._connector) {
      instance._connector._initialize();
      res.json(String(instance));
    } else {
      res.status(500).send('There is no connector for instance ' + req.params.id);
    }
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
router.get('/instance/:id/configure', (req, res) => {

})

// Set and get keys from instance/id's tree.
router.get('/tree/:id/:path', (req, res) => {
  if (tree.contains('/instance/') + req.params.id) {
    let instance = tree.findNode('/instance').getChild(req.params.id);
    if instance.tree.contains(req.params.path) {
      res.json(String(instance.tree.findNode(req.params.path)));
    } else {
      res.status(500).send('Key with path ' + req.params.path + ' was not found');
    }
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

router.post('/tree/:id/:path', (req, res) => {
  if (tree.contains('/instance/') + req.params.id) {
    let instance = tree.findNode('/instance').getChild(req.params.id);
    if instance.tree.contains(req.params.path) {
      instance.tree.findNode(req.params.path).set(req.body.value);
      res.status(200);
    } else {
      res.status(500).send('Key with path ' + req.params.path + ' was not found');
    }
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Will print the TOML representation of an object.
router.get('/tree/:id/:path/dump', (req, res) => {

})

module.exports = router;
