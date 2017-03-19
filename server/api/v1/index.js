/**
 * @module api
 * The RESTful API that drives flex.
 * 
 * TODO: swagger documentation, see https://www.npmjs.com/package/swagger-jsdoc
 */

const process = require('process');
const express = require('express');
const bodyParser = require('body-parser');
// TODO: const stringify = require('json-stringify-safe');
const path = require('path');
const util = require('util');
const debuglog = util.debuglog('api/v1');

// Pull the inexor dependencies
const context = require('@inexor-game/context');
const tree = require('@inexor-game/tree');
const manager = require('@inexor-game/manager');
const media = require('@inexor-game/media');
const Connector = require('@inexor-game/connector');
const inexor_path = require('@inexor-game/path');
// const configurator = require('@inexor-game/configurator');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Build the application context and contruct components
let application_context = new context.ApplicationContext();
let root = application_context.construct('tree', function() { return new tree.Root(application_context); });
let media_repository_manager = application_context.construct('media_repository_manager', function() { return new media.Repository.MediaRepositoryManager(application_context); });
//let media_manager = application_context.construct('media_manager', function() { return new media.Media.MediaManager(application_context); });

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
    debuglog("Creating instance: " + req.params.id);
    manager.create(instances, req.params.id, req.body.port, req.body.type, req.body.name, req.body.description).then((instance_node) => {
    	// let node = instances.addChild(String(instance.id), 'node');
    	// node.addChild('type', 'string', req.body.type);
      // node.addChild('port', 'int64', instance.port);
      // node.addChild('name', 'string', req.body.name);
      // node.addChild('description', 'string', req.body.description);
    	// node.addChild('state', 'string', 'stopped');
    	// let instance_node = node.addChild('instance', 'object', instance);
    	debuglog('Successfully created instance: ' + instance_node.getPath());
      res.status(201).json(instance_node.get());
    }).catch((err) => {
      debuglog(err);
      // Failed to create the instance
      res.status(500).send(err);
    })
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
    let instance_node = instances.getChild(req.params.id);
    manager.start(instance_node).then((instance_node) => {
      // res.json(instance_node);
      res.status(200).send({});
    }).catch((err) => {
      debuglog(err);
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
    // res.json(instances.get());
    res.status(200).send({});
  }).catch((err) => {
    debuglog(err);
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
      // res.json(instance);
      res.status(200).send({});
    }).catch((err) => {
      debuglog(err);
      res.status(500).send(err);
    })
  } else {
    res.status(404).send(util.format('Cannot stop instance. Instance with id %s was not found', req.params.id));
  }
})

// Stops all existing instances.
router.get('/instances/stop', (req, res)  => {
  manager.stopAll().then(() => {
    // res.json(instances.get());
    res.status(200).send({});
  }).catch((err) => {
    debuglog(err);
    res.status(500).send(err);
  })
})

// Connects to the instance with :id.
// Returns HTTP status code 200 and the instance object if the connection was established successfully.
// Returns HTTP status code 404 if there is no instance with the given id.
// Returns HTTP status code 500 if the connection failed.
router.get('/instances/:id/connect', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let instance_node = instances.getChild(req.params.id);
    let connector = new Connector(instance_node);
    try {
      connector.connect();
      // Useful for synchronization
      instance_node.addChild('connector', 'object', connector);
      // res.status(200).json(instance_node);
      res.status(200).send({});
    } catch (err) {
      debuglog(err);
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
    let instance_node = instances.getChild(req.params.id);
    if (instance_node.hasChild('connector')) {
      instance_node.getChild('connector')._initialize();
      // res.json(instance_node);
      res.status(200).send({});
    } else {
      res.status(500).send(util.format('Cannot synchronize with instance. There is no connector for instance with id %s!', req.params.id));
    }
  } else {
    res.status(404).send(util.format('Cannot synchronize with instance. Instance with id %s was not found', req.params.id));
  }
})

// Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
router.get('/instances/:id/configure', (req, res) => {

})

// Returns the subtree of tree node of an instance tree.
router.get('/instances/:id/dump', (req, res) => {
  if (instances.hasChild(req.params.id)) {
    let node = instances.getChild(req.params.id);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(node.toObject());
  } else {
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

// Returns the value of the tree node.
router.get('/instances/:id/*', (req, res) => {
  let path = req.param(0);
  if (instances.hasChild(req.params.id)) {
    let full_path = '/instances/' + req.params.id + '/' + path;
    let node = root.findNode(full_path);
    if (node != null) {
      res.status(200).json(node.get());
      // res.type('json').send(node.get());
    } else {
      res.status(404).send('Key with path ' + path + ' was not found');
    }
  } else {
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

// Sets the value of the tree node.
router.post('/instances/:id/*', (req, res) => {
  let path = req.param(0);
  if (instances.hasChild(req.params.id)) {
    let full_path = '/instances/' + req.params.id + '/' + path;
    let node = root.findNode(full_path);
    if (node != null) {
      node.set(req.body.value, req.body.nosync);
      res.status(200).json(node.get());
    } else {
      res.status(404).send('Key with path ' + path + ' was not found');
    }
  } else {
    res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
  }
})

// Scans a new media repository.
router.post('/media/repositories', (req, res)  => {
  media_repository_manager.scanAll();
  //TODO: improve result
  res.status(200).send({});
})

// Creates a new media repository.
router.post('/media/repositories/:name', (req, res)  => {
  if (req.body.type != null) {
    let repository_path = path.resolve(path.join(path.join(inexor_path.getBasePath(), inexor_path.media_path), req.params.name));
    switch (req.body.type) {
      case 'fs':
        let repository_node = media_repository_manager.fs.createRepository(req.params.name, repository_path);
        res.status(201).json(repository_node.get());
        break;
      case 'git':
        if (req.body.url != null) {
          let repository_node = media_repository_manager.git.createRepository(req.params.name, repository_path, req.body.url);
          res.status(201).json(repository_node.get());
        } else {
          res.status(500).send(util.format('Missing parameter: url'));
        }
        break;
    }
  } else {
    res.status(500).send(util.format('Missing parameter: type'));
  }
})

// Updates a media repository.
router.put('/media/repositories/:name', (req, res)  => {
  if (media_repository_manager.exists(req.params.name)) {
    media_repository_manager.update(req.params.name);
    res.status(200).send({});
  } else {
    res.status(404).send(util.format('Media repository %s was not found', req.params.name));
  }
})

// Updates a media repository.
router.put('/media/repositories/:name/:branchName', (req, res)  => {
  if (media_repository_manager.exists(req.params.name)) {
    media_repository_manager.update(req.params.name, req.params.branchName);
    res.status(200).send({});
  } else {
    res.status(404).send(util.format('Media repository %s was not found', req.params.name));
  }
})

// Removes a repository from the Inexor Tree.
router.delete('/media/repositories/:name', (req, res)  => {
  if (media_repository_manager.exists(req.params.name)) {
    media_repository_manager.remove(req.params.name);
    // Successfully removed
    res.status(204).send({});
  } else {
    res.status(404).send(util.format('Media repository %s was not found', req.params.name));
  }
})

// Will print the TOML representation of an object.
router.get('/flex/shutdown', (req, res) => {
  res.json({absence_message: 'The server is ordered to halt. Beep bup. No more killing ogro.'});
  process.exit();
})

module.exports = router;
