/**
 * @module api
 * The RESTful API that drives flex.
 * 
 * TODO: swagger documentation, see https://www.npmjs.com/package/swagger-jsdoc
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
  debuglog('Showing instances [:%o]', instances.toString());
  res.type('json').send(instances.toString());
})

// Lists information about a given instance or raises a NonFoundError
// Returns HTTP status code 404 if there is no instance with the given id.
router.get('/instances/:id', (req, res) => {
	if (instances.hasChild(req.params.id)) {
		let node = instances.getChild(req.params.id);
		let instance_node = node.getChild('instance');
		res.json(instance_node.get());
	} else {
		res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
	}
})

// Creates an instance with the given :id and inserts it into the tree.
// Returns HTTP status code 201 and the instance object if the instance was created.
// Returns HTTP status code 409 if the instance already exists
// Returns HTTP status code 400 if the request has wrong parameters
// Returns HTTP status code 500 if the instance couldn't be created
router.post('/instances/:id', (req, res) => {
  if (!instances.hasChild(req.params.id)) {
    if (req.body.args != null) {
      manager.create(req.body.args, req.params.id, req.body.port).then((instance) => {
      	let node = instances.addChild(String(instance.id), 'node');
      	node.addChild('name', 'string', req.params.name);
      	node.addChild('type', 'string', req.params.type);
      	node.addChild('state', 'string', 'stopped');
      	let instance_node = node.addChild('instance', 'flex', instance);
      	debuglog("Successfully created instance: " + node.getPath());
        res.status(201).json(instance_node.get());
      }).catch((err) => {
        // Failed to create the instance
        res.status(500).send(err);
      })
    } else {
      // Bad request: wrong parameters
      res.status(400).send('Instance can not be created without command line arguments.');
    }
  } else {
    // The instance id already exist!
    res.status(409).send(util.format('Instance with id %s already exists.', req.params.id));
  }
})

// Removes the instance with :id
// Returns HTTP status code 204 if the instance was successfully removed
// Returns HTTP status code 404 if there is no instance with the given id.
router.delete('/instances/:id', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    instaces.removeChild(req.params.id);
    // Successfully removed
    res.status(204).send({});
  } else {
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

// Starts the instance with :id.
// Returns the instance object.
// Returns HTTP status code 404 if there is no instance with the given id.
// Returns HTTP status code 500 if the instance couldn't be started.
router.get('/instances/:id/start', (req, res)  => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    manager.start(instance_node.get()).then((instance) => {
      instance_node.set(instance);
      instance_node.getParent().getChild('state').set('started');
      res.json(instance);
    }).catch((err) => {
      // Failed to start the instance
      res.status(500).send(err);
    })
  } else {
    res.status(404).send(util.format('Cannot start instance. Instance with id %s was not found', req.params.id));
  }
})

// Starts all existing instances.
router.get('/instances/start', (req, res)  => {
  manager.startAll().then(() => {
    res.json(instances.get());
  }).catch((err) => {
    res.status(500).send(err);
  })
})

// Stops the instance with :id.
// Returns the instance object.
// Returns HTTP status code 404 if there is no instance with the given id.
// Returns HTTP status code 500 if the instance couldn't be started.
router.get('/instances/:id/stop', (req, res)  => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    manager.stop(instance_node.get()).then((instance) => {
      instance_node.set(instance);
      instance_node.getParent().getChild('state').set('stopped');
      res.json(instance);
    }).catch((err) => {
      res.status(500).send(err);
    })
  } else {
    res.status(404).send(util.format('Cannot stop instance. Instance with id %s was not found', req.params.id));
  }
})

// Stops all existing instances.
router.get('/instances/stop', (req, res)  => {
  manager.stopAll().then(() => {
    res.json(instances.get());
  }).catch((err) => {
    res.status(500).send(err);
  })
})

// Connects to the instance with :id.
// Returns HTTP status code 200 and the instance object if the connection was established successfully.
// Returns HTTP status code 404 if there is no instance with the given id.
// Returns HTTP status code 500 if the connection failed.
router.get('/instances/:id/connect', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    let instance = instance_node.get();
    let connector = new Connector(instance.port, instance.tree);

    try {
      connector.connect();
      // Useful for synchronization
      instance._connector = connector;
      res.json(instance.toStr());
    } catch (err) {
      res.status(500).send(err);
    }

  } else {
    res.status(404).send(util.format('Cannot connect to instance. Instance with id %s was not found', req.params.id));
  }
})

// Synchronizes an instance with Inexor Core.
// Returns HTTP status code 200 and the instance object if the synchronization was performed successfully.
// Returns HTTP status code 404 if there is no instance with the given id.
// Returns HTTP status code 500 if the synchronization failed.
router.get('/instances/:id/synchronize', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    let instance = instance_node.get();

    if (instance._connector) {
      instance._connector._initialize();
      res.json(instance.toStr());
    } else {
      res.status(500).send(util.format('Cannot synchronize with instance. There is no connector for instance with id %s!', req.params.id));
    }
  } else {
    res.status(404).send(util.format('Cannot synchronize with instance. Instance with id %s was not found', req.params.id));
  }
})

// Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
router.get('/instance/:id/configure', (req, res) => {

})

// Set and get keys from instance/id's tree.
router.get('/tree/:id/:path', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    let instance = instance_node.get();
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
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

router.post('/tree/:id/:path', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    let instance_node = node.getChild('instance');
    let instance = instance_node.get();
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
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

// Will print the TOML representation of an object.
router.get('/flex/shutdown', (req, res) => {
  res.json({absence_message: 'The server is ordered to halt. Beep bup. No more killing ogro.'});
  process.exit();
})

module.exports = router;
