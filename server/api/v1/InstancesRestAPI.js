const express = require('express');
const process = require('process');
const util = require('util');

const inexor_log = require('@inexor-game/logger');
const log = inexor_log('@inexor-game/flex/api/v1/instances');

/**
 * REST API for managing instances of Inexor Core.
 */
class InstancesRestAPI {

  /**
   * Constructs the Instances REST API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The Inexor Tree
    this.root = applicationContext.get('tree');

    // The instance manager
    this.instanceManager = applicationContext.get('instanceManager');

    // The tree node which contains all instance nodes
    this.instancesNode = this.root.getOrCreateNode('instances');

    // Delivery the web user interfaces
    this.router.use('/interfaces', express.static('interfaces'));

    // Lists all available instances
    this.router.get('/instances', this.listInstances.bind(this));

    // Lists information about a given instance or raises a NonFoundError
    this.router.get('/instances/:id', this.getInstance.bind(this));

    // Creates an instance with the given :id and inserts it into the tree.
    this.router.post('/instances/:id', this.createInstance.bind(this));

    // Removes the instance with :id
    this.router.delete('/instances/:id', this.removeInstance.bind(this));

    // Starts the instance with :id.
    this.router.get('/instances/:id/start', this.startInstance.bind(this));

    // Starts all existing instances.
    this.router.get('/instances/start', this.startAllInstances.bind(this));

    // Stops the instance with :id.
    this.router.get('/instances/:id/stop', this.stopInstance.bind(this));

    // Stops all existing instances.
    this.router.get('/instances/stop', this.stopAllInstances.bind(this));

    // Connects to the instance with :id.
    this.router.get('/instances/:id/connect', this.connectToInstance.bind(this));

    // Disconnects from the instance with :id.
    this.router.get('/instances/:id/disconnect', this.disconnectFromInstance.bind(this));

    // Synchronizes an instance with Inexor Core.
    this.router.get('/instances/:id/synchronize', this.synchronizeWithInstance.bind(this));

    // Configures the tree from instance :id using the TOML cofigurator module. Returns the configured tree or raises an error.
    this.router.get('/instances/:id/configure', (req, res) => { });

  }

  /**
   * Lists all instances.
   */
  listInstances(req, res) {
    res.status(200).json(this.instancesNode.getChildNames());
  }

  /**
   * @swagger
   * /api/v1/instances/
   *   get:
   *     description: Lists information about a given instance.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: id
   *         description: The instance id
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: The instance node
   *       404:
   *         description: No instance with the given id.
   */
  getInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      res.status(200).json(instanceNode.toJson());
    } else {
      res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Creates an instance with the given :id and inserts it into the tree.
   * Returns HTTP status code 201 and the instance object if the instance was created.
   * Returns HTTP status code 409 if the instance already exists
   * Returns HTTP status code 400 if the request has wrong parameters
   * Returns HTTP status code 500 if the instance couldn't be created
   */
  createInstance(req, res) {
    if (!this.instancesNode.hasChild(req.params.id)) {
      this.instanceManager
        .create(req.params.id, req.body.type, req.body.name, req.body.description, req.body.persistent, req.body.autostart, req.body.autorestart)
        .then((instanceNode) => {
          res.status(201).json(instanceNode.get());
        }).catch((err) => {
          // Failed to create the instance
          log.error(util.format('Failed to create instance %s: %s', req.params.id, err.message));
          res.status(500).send(err);
        });
    } else {
      // The instance id already exist!
      res.status(409).send(util.format('Instance with id %s already exists.', req.params.id));
    }
  }

  /**
   * Removes the instance with :id
   * Returns HTTP status code 204 if the instance was successfully removed
   * Returns HTTP status code 404 if there is no instance with the given id.
   */
  removeInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      this.instancesNode.removeChild(req.params.id);
      // Successfully removed
      res.status(204).send({});
    } else {
      res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Starts the instance with :id.
   * Returns the instance object.
   * Returns HTTP status code 404 if there is no instance with the given id.
   * Returns HTTP status code 500 if the instance couldn't be started.
   */
  startInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      this.instanceManager.start(instanceNode).then((instanceNode) => {
        // res.json(instanceNode);
        res.status(200).send({});
      }).catch((err) => {
        log.error(err);
        // Failed to start the instance
        res.status(500).send(err);
      })
    } else {
      res.status(404).send(util.format('Cannot start instance. Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Starts all existing instances.
   */
  startAllInstances(req, res) {
    this.instanceManager.startAll().then(() => {
      res.status(200).send({});
    }).catch((err) => {
      log.error(err);
      res.status(500).send(err);
    })
  }

  /**
   * Stops the instance with :id.
   * Returns the instance object.
   * Returns HTTP status code 404 if there is no instance with the given id.
   * Returns HTTP status code 500 if the instance couldn't be started.
   */
  stopInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      this.instanceManager.stop(instanceNode).then((instanceNode) => {
        // instanceNode.set(instance);
        // instanceNode.getParent().getChild('state').set('stopped');
        // res.json(instance);
        res.status(200).send({});
      }).catch((err) => {
        log.error(err);
        res.status(500).send(err);
      });
    } else {
      res.status(404).send(util.format('Cannot stop instance. Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Stops all existing instances.
   */
  stopAllInstances(req, res) {
    this.instanceManager.stopAll().then(() => {
      res.status(200).send({});
    }).catch((err) => {
      log.error(err);
      res.status(500).send(err);
    });
  }

  /**
   * Connects to the instance with :id.
   * Returns HTTP status code 200 and the instance object if the connection was established successfully.
   * Returns HTTP status code 404 if there is no instance with the given id.
   * Returns HTTP status code 500 if the connection failed.
   */
  connectToInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      this.instanceManager.connect(instanceNode).then((instanceNode) => {
        res.status(200).send({});
      }).catch((err) => {
        log.error(err);
        res.status(500).send(err);
      });
    } else {
      res.status(404).send(util.format('Cannot connect to instance. Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Disconnects from the instance with :id.
   */
  disconnectFromInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      this.instanceManager.disconnect(instanceNode).then((instanceNode) => {
        res.status(200).send({});
      }).catch((err) => {
        log.error(err);
        res.status(500).send(err);
      });
    } else {
      res.status(404).send(util.format('Cannot connect to instance. Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Synchronizes an instance with Inexor Core.
   *
   * TODO: remove (we are synchronizing with events)
   *
   * Returns HTTP status code 200 and the instance object if the synchronization was performed successfully.
   * Returns HTTP status code 404 if there is no instance with the given id.
   * Returns HTTP status code 500 if the synchronization failed.
   */
  synchronizeWithInstance(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      if (instanceNode.hasChild('connector')) {
        instanceNode.getChild('connector')._initialize();
        // res.json(instanceNode);
        res.status(200).send({});
      } else {
        res.status(500).send(util.format('Cannot synchronize with instance. There is no connector for instance with id %s!', req.params.id));
      }
    } else {
      res.status(404).send(util.format('Cannot synchronize with instance. Instance with id %s was not found', req.params.id));
    }
  }


}

module.exports = InstancesRestAPI;
