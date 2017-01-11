/**
 * @module api
 * The API that drives flex.
 *
 */

const process = require('process');
const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const debuglog = util.debuglog('api/v1');

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
var instances = null;
if (!root.hasChild('instances')) {
  instances = root.addChild('instances', 'node');
}

// Lists all available instances
router.get('/instances', (req, res) => {
  res.type('json').send(instances.get());
})

// Lists information about a given instance or raises a NonFoundError
router.get('/instances/:id', (req, res) => {
	if (instances.hasChild(req.params.id)) {
		let node = instances.getChild(req.params.id);
		res.json(node.get());
	} else {
		res.status(404).send('Instance with id ' + req.params.id + ' was not found');
	}
})

// Creates an instance and inserts it into the tree. Returns the instance object, otherwise raises an error.
router.post('/instances/:id', (req, res) => {
  if (!instances.hasChild(req.params.id)) {
    if (req.body.args == null) {
      res.status(500).send('Instance can not be created without command line arguments.');
    } else {
      manager.create(req.body.args, req.params.id, req.body.port).then((instance) => {
      	let node = instances.addChild(String(instance.id), 'flex', instance);
      	debuglog("Successfully created instance: " + node.getPath());
        res.status(201).json(node.get());
      }).catch((err) => {
        res.status(500).send(err);
      })
    }
  } else {
    res.status(409).send('Instance with id ' + req.params.id + ' already exists.')
  }
})

// Starts an instance with :id. Returns the started instance or raises an error.
router.get('/instances/:id/start', (req, res)  => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    manager.start(node.get()).then((instance) => {
      node.set(instance);
      res.json(instance);
      // TODO: res.json(node.get());
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(404).send('Cannot start instance ' + req.params.id + '! Instance does not exist. You have to create an instance first.');
  }
})

// Stops an instance with :id. Returns the stoped instance or raises an error.
router.get('/instances/:id/stop', (req, res)  => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    manager.stop(node.get()).then((instance) => {
      node.set(instance);
      res.json(instance);
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(404).send('Cannot stop instance ' + req.params.id + '! Instance does not exist.');
  }
})

// Connects an instance with :id to Inexor Core. Returns the connected instance or raises an error.
router.get('/instances/:id/connect', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
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
    res.status(404).send('Cannot connect with instance ' + req.params.id + '! Instance does not exist.');
  }
})

// Synchronizes an instance with Inexor Core. Returns the synchronized instance or raises an error.
router.get('/instances/:id/synchronize', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance = node.get();

    if (instance._connector) {
      instance._connector._initialize();
      res.json(instance.toStr());
    } else {
      res.status(500).send('There is no connector for instance ' + req.params.id);
    }
  } else {
    res.status(404).send('Cannot synchronize with instance ' + req.params.id + '! Instance does not exist.');
  }
})

// Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
router.get('/instance/:id/configure', (req, res) => {

})

// Set and get keys from instance/id's tree.
router.get('/tree/:id/:path', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance = node.get();
    if (instance.tree.contains(req.params.path)) {
      if (instance.tree.findNode(req.params.path) == 'node') {
        res.type('json').send(instance.tree.findNode(req.params.path).toString());
      } else {
        res.json(instance.tree.findNode(req.params.path).get());
      }
    } else {
      res.status(404).send('Key with path ' + req.params.path + ' was not found');
    }
  } else {
    res.status(404).send('Instance ' + req.params.id + ' was not found.');
  }
})

router.post('/tree/:id/:path', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance = node.get();
    if (instance.tree.contains(req.params.path)) {
      if (instance.tree.findNode(req.params.path)._datatype == 'node') {
        res.status(500).send('Synchronizing nodes is not possible.');
      } else {
        instance.tree.findNode(req.params.path).set(req.body.value);
        res.status(200);
      }
    } else {
      res.status(404).send('Key with path ' + req.params.path + ' was not found');
    }
  } else {
    res.status(404).send('Instance ' + req.params.id + ' was not found.');
  }
})

// Will print the TOML representation of an object.
router.get('/tree/:id/:path/dump', (req, res) => {

})

module.exports = router;
