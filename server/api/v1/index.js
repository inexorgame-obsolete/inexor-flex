/**
 * @module api
 * The API that drives flex.
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
// NOTE: This might be changed in the future where trees can be im/exported
if (!root.contains('/instances')) {
  root.addChild('instances', 'node');
}

// Lists all available instances
router.get('/instances', (req, res) => {
  let instances = root.findNode('/instances')
  console.log(root);
  res.type('json').send(instances.toString());
})

// Lists information about a given instance or raises a NonFoundError
router.get('/instances/:id/', (req, res) => {
  if (!root.contains('/instances/' + req.params.id)) {
    res.status(500).send('Instance with id ' + req.params.id + ' was not found');
  } else {
    let node = root.findNode('/instances/' + req.params.id);
    res.json(node.get());
  }
})

// Creates an instance and inserts it into the tree. Returns the instance object, otherwise raises an error.
router.post('/instances/:id/', (req, res) => {
  if (!root.contains('/instances/' + req.params.id)) {
    if (req.body.args == null) {
      res.status(500).send('Instance can not be created without command line arguments.');
    } else {
      manager.create(req.body.args, req.params.id, req.body.port).then((instance) => {
        let node = root.findNode('/instances').addChild(String(instance.id), 'flex', instance);
        console.log(node);
        res.json(node.get());
      }).catch((err) => {
        res.status(500).send(err);
      })
    }
  } else {
    res.status(500).send('Instance with id ' + req.params.id + ' already exists.')
  }
})

// Starts an instance with :id. Returns the started instance or raises an error.
router.get('/instances/:id/start', (req, res)  => {
  if (root.contains('/instance/' + req.params.id)) {
    let node = root.findNode('/instance').getChild(req.params.id);
    manager.start(node.get()).then((instance) => {
      node.set(i);
      res.json(instance);
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Stops an instance with :id. Returns the stoped instance or raises an error.
router.get('/instances/:id/stop', (req, res)  => {
  if (root.contains('/instance/' + req.params.id)) {
    let node = root.findNode('/instance').getChild(req.params.id);
    manager.stop(node.get()).then((instance) => {
      node.set(instance);
      res.json(instance);
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Connects an instance with :id to Inexor Core. Returns the connected instance or raises an error.
router.get('/instance/:id/connect', (req, res) => {
  if (root.contains('/instance/' + req.params.id)) {
    let node = root.findNode('/instance').getChild(req.params.id);
    let instance = node.get();
    let connector = new Connector(instance.port, instance.tree);

    try {
      connector.connect();
      instance._connector = connector; // Usefull for synchronization
      res.json(instance.toStr());
    } catch (err) {
      res.status(500).send(err);
    }

  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Synchronizes an instance with Inexor Core. Returns the synchronized instance or raises an error.
router.get('/instance/:id/synchronize', (req, res) => {
  if (root.contains('/instance/' + req.params.id)) {
    let node = root.findNode('/instance').getChild(req.params.id);
    let instance = node.get();

    if (instance._connector) {
      instance._connector._initialize();
      res.json(instance.toStr());
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
  if (root.contains('/instance/') + req.params.id) {
    let node = root.findNode('/instance').getChild(req.params.id);
    let instance = node.get();
    if (instance.tree.contains(req.params.path)) {
      if (instance.tree.findNode(req.params.path) == 'node') {
        res.type('json').send(instance.tree.findNode(req.params.path).toString());
      } else {
        res.json(instance.tree.findNode(req.params.path).get())
      }
    } else {
      res.status(500).send('Key with path ' + req.params.path + ' was not found');
    }
  } else {
    res.status(500).send('Instance ' + req.params.id + ' was not found.');
  }
})

router.post('/tree/:id/:path', (req, res) => {
  if (root.contains('/instance/') + req.params.id) {
    let node = root.findNode('/instance').getChild(req.params.id);
    let instance = node.get();
    if (instance.tree.contains(req.params.path)) {
      if (instance.tree.findNode(req.params.path)._datatype == 'node') {
        res.status(500).send('Synchronizing nodes is not possible.')
      } else {
        instance.tree.findNode(req.params.path).set(req.body.value);
        res.status(200);
      }
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

var plugins = require('@inexor-game/plugins')

router.get('/plugins/:name/:method', (req, res) => {
  try {
    let f = new Function('return function ' + req.params.method + '()');
    plugins[req.params.name].f();
    res.status(200);
  } catch (err) {
    res.status(500).send(err);
  }
})

module.exports = router;
