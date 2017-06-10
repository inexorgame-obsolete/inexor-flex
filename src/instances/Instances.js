/**
 * This module is responsible for the lifecycle of instances of Inexor Core.
 * 
 * Inexor Core instances can be a game client or a game server. In future there
 * may be other types of instances like bots.
 * 
 * Each instance contains it's own subtree in the Inexor Tree.
 * 
 * The lifecycle is defined by the states an instance of Inexor Core can have.
 * 
 * @module instances
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const portastic = require('portastic');
const process = require('process');
const spawn = require('child_process').spawn;
const toml = require('toml');
const tomlify = require('tomlify');
const util = require('util');

const Connector = require('./Connector');
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');
// const inexor_log = require('@inexor-game/logger');

// const log = inexor_log('@inexor-game/flex/instances/InstanceManager');

/**
 * The list of instance types.
 * @constant {number}
 */
const instance_types = [
  'server',
  'client'
];

/**
 * The instance states.
 * TODO: document the states in the wiki
 * 
 * @constant {array}
 */
const instance_states = [
  null,
  'stopped',
  'started',
  'running',
  'paused'
];

/**
 * The valid transitions of the instance states
 * @constant {array}
 */
const instance_transitions = [
  { 'name': 'create',     'oldState': null,      'newState': 'stopped' },
  { 'name': 'start',      'oldState': 'stopped', 'newState': 'started' },
  { 'name': 'connect',    'oldState': 'started', 'newState': 'running' },
  { 'name': 'pause',      'oldState': 'running', 'newState': 'paused'  },
  { 'name': 'resume',     'oldState': 'paused',  'newState': 'running' },
  { 'name': 'disconnect', 'oldState': 'running', 'newState': 'started' },
  { 'name': 'stop',       'oldState': 'started', 'newState': 'stopped' },
  { 'name': 'destroy',    'oldState': 'stopped', 'newState': null      }
];

/**
 * The default instance type.
 * @constant {string}
 */
const default_instance_type = 'client';

/**
 * The default instance state.
 * @constant {string}
 */
const default_instance_state = 'stopped';

/**
 * The default ports to use.
 * @constant {array}
 */
const default_instance_ports = {
    'server': 31414,
    'client': 31417
}

/**
 * The instance manager manages all instances.
 */
class InstanceManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(applicationContext) {
    super();

    /// The application context
    // this.applicationContext = applicationContext;

    /// The class logger
    // this.log = applicationContext.get('logManager').getLogger('instances.InstanceManager');

    /// The Inexor Tree root node
    // this.root = applicationContext.get('tree');

  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing instances
    this.instancesNode = this.root.getOrCreateNode('instances');

    /// The profile manager service
    this.profileManager = this.applicationContext.get('profileManager');

    /// The console manager service
    this.consoleManager = this.applicationContext.get('consoleManager');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.instances.InstanceManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    // Loading of the instances configuration is deferred until Inexor Flex has been fully initialized

  }

  /**
   * Returns if an instance with the given identifier exists.
   * @function
   * @param {number} [instanceId] - the instance identifier
   * @return {boolean} - True, if the instance exists.
   */
  exists(instanceId) {
    return this.instancesNode.hasChild(instanceId);
  }

  
  clear() {
    return new Promise((resolve, reject) => {
      this.instancesNode.removeAllChildren();
      resolve(true);
    });
  }

  /**
   * Creates an instance of Inexor Core. The instance is created but not started!
   * @function
   * @param {number} [identifier] - the instance identifier
   * @param {string} [type] - the instance type - either server or client
   * @param {string} [name] - the name of the instance
   * @param {string} [description] - the description of the instance
   * @param {boolean} persistent - True, if the instance should be persisted.
   * @param {boolean} autostart - True, if the instance should be started automatically on startup.
   * @param {boolean} autorestart - True, if the instance should be restarted automatically on shutdown of the instance.
   * @return {Promise<tree.Node>} - the tree node which represents the instance
   */
  create(identifier = null, type = default_instance_type, name = '', description = '', persistent = false, autostart = false, autorestart = false) {
    return new Promise((resolve, reject) => {
      if (identifier == null) {
        reject(new Error('Failed to create instance: No identifier'));
      } else if (this.instancesNode.hasChild(String(identifier))) {
        reject(new Error('Failed to create instance: Instance already exists'));
      }

      // Create the instance sub tree
      let instanceNode = this.instancesNode.addNode(String(identifier));

      // Start with state 'stopped'
      instanceNode.addChild('state', 'string', default_instance_state);

      // The instance type, e.g. 'client', 'server', ...
      instanceNode.addChild('type', 'string', type);

      // The name of the instance, e.g. 'Client 1'
      instanceNode.addChild('name', 'string', name);

      // The description of the instance, e.g. 'The default client'
      instanceNode.addChild('description', 'string', description);

      // The port of the GRPC server
      instanceNode.addChild('port', 'int64', identifier);

      // The instance automatically starts on startup
      instanceNode.addChild('autostart', 'bool', autostart);

      // The instance automatically restarts on shutdown of the instance
      instanceNode.addChild('autorestart', 'bool', autorestart);

      // Save instances.toml
      if (persistent) {
        // TODO: save only the current instance
        this.saveInstances();
      }

      resolve(instanceNode);
    });
  }

  /**
   * Removes an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance to start.
   * @return {Promise<instance>}
   */
  remove(instanceNode) {
    return new Promise((resolve, reject) => {
      // TODO: only if state is
    });
  }

  /**
   * Starts an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance to start.
   * @return {Promise<instance>}
   */
  start(instanceNode) {
    let instanceId = instanceNode.getName();
    let instance_port = instanceNode.port;
    let instance_type = instanceNode.type;
  	this.log.info('Starting instance ' + instanceNode.name + ' (id: ' + instanceId + ', type: ' + instance_type + ', port: ' + instance_port + ')');
  
    return new Promise((resolve, reject) => {
      
      // Resolve executable
      let executable_path = inexor_path.getExecutablePath(instance_type)
      if (!fs.existsSync(executable_path)) {
        reject(new Error('Executable does not exist: ' + executable_path));
      }

      // Starting a new process with the instance id as only argument
      let args = [ instanceId ];
      let options = {
        cwd: path.resolve(inexor_path.getBasePath()),
        env: process.env
      };
      this.log.info(util.format('Starting %s %s', executable_path, args.join(' ')));
      
      // Spawn process
      let instanceProcess = spawn(executable_path, args, options);
      this.log.info(util.format('%s process started with PID %d', this.getInstanceName(instanceNode), instanceProcess.pid));

      instanceProcess.on('error', (err) => {
        instanceNode.removeChild('process');
        this.transist(instanceNode, 'running', 'started');
        this.transist(instanceNode, 'started', 'stopped');
        if (err != null) {
          this.log.error(util.format('Error in %s: %s', this.getInstanceName(instanceNode), err.message));
        }
      });
      instanceProcess.on('exit', (code, signal) => {
        instanceNode.removeChild('process');
        this.transist(instanceNode, 'running', 'started');
        this.transist(instanceNode, 'started', 'stopped');
        if (code != null) {
          this.log.info(util.format('%s process exited with exit code %d', this.getInstanceName(instanceNode), code));
        } else if (signal != null) {
          this.log.info(util.format('%s process exited with signal %s', this.getInstanceName(instanceNode), signal));
        }
      });

      // Store the instance PID
      instanceNode.addChild('pid', 'int64', instanceProcess.pid);

      // Store the process handle of the instance
      instanceNode.addChild('process', 'object', instanceProcess);
      
      // Create a logger for the instance
      this.consoleManager.createConsole(instanceNode, instanceProcess).then((consoleNode) => {
        resolve(instanceNode);
      }).catch((err) => {
        reject('Failed to create instance console');
      });

      this.transist(instanceNode, 'stopped', 'started');
      resolve(instanceNode);

    });
  }

  /**
   * Stops an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance to stop.
   * @return {Promise<tree.Node>}
   */
  stop(instanceNode) {
    return new Promise((resolve, reject) => {
      try {
        this.log.info(util.format('Stopping instance %s', this.getInstanceName(instanceNode)));
        // SIGTERM
        instanceNode.getChild('process').get().kill();
        resolve(instanceNode);
      } catch (err) {
        reject(util.format('Failed to stop instance %s', this.getInstanceName(instanceNode)));
      }
    });
  }

  /**
   * Connects to an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance to connect to.
   * @return {Promise<tree.Node>}
   */
  connect(instanceNode) {
    return new Promise((resolve, reject) => {
      try {
        let connector = new Connector(instanceNode);
        // Store the connector as private child of the instance node
        instanceNode.addChild('connector', 'object', connector, false, true);
        connector.connect().then((instanceNode) => {
          this.transist(instanceNode, 'started', 'running');
          resolve(instanceNode);
        }).catch((err) => {
          reject(util.format('Failed to connect to instance %s', this.getInstanceName(instanceNode)));
        });
      } catch (err) {
        this.log.error(err);
        reject(util.format('Failed to connect to instance %s', this.getInstanceName(instanceNode)));
      }
    });
  }

  /**
   * Disconnects from an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance to disconnect from.
   * @return {Promise<tree.Node>}
   */
  disconnect(instanceNode) {
    return new Promise((resolve, reject) => {
      try {
        let connector = instanceNode.connector.get();
        connector.disconnect();
        instanceNode.removeChild('connector');
        this.transist(instanceNode, 'running', 'started');
        resolve(instanceNode);
      } catch (err) {
        this.log.error(err);
        reject(util.format('Failed to disconnect from instance %s', this.getInstanceName(instanceNode)));
      }
    });
  }

  /**
   * Pauses a running instance.
   * @function
   * @param {tree.Node} instanceNode - The instance to stop.
   * @return {Promise<tree.Node>}
   */
  pause(instanceNode) {
    return new Promise((resolve, reject) => {
      this.transist(instanceNode, 'running', 'paused');
      resolve(instanceNode);
    });
  }

  /**
   * Resumes a paused instance.
   * @function
   * @param {tree.Node} instanceNode - The instance to stop.
   * @return {Promise<tree.Node>}
   */
  resume(instanceNode) {
    return new Promise((resolve, reject) => {
      this.transist(instanceNode, 'paused', 'running');
      resolve(instanceNode);
    });
  }

  /**
   * Starts all available instances
   * @function
   * @return {Promise<bool>}
   */
  startAll() {
    return new Promise((resolve, reject) => {
      let instanceIds = this.instancesNode.getChildNames();
      for (let i = 0; i < instanceIds.length; i += 1) {
        this.start(this.instancesNode.getChild(instanceIds[i]));
      }
      resolve(true);
    });
  }

  /**
   * Stops all running instances.
   * @function
   * @return {Promise<bool>}
   */
  stopAll() {
    return new Promise((resolve, reject) => {
      let instanceIds = this.instancesNode.getChildNames();
      for (let i = 0; i < instanceIds.length; i += 1) {
        this.stop(this.instancesNode.getChild(instanceIds[i]));
      }
      resolve(true);
    });
  }

  /**
   * Loading instances from a TOML file.
   * @function
   * @param {string} [filename] - The filename.
   * @return {Promise<bool>}
   */
  loadInstances(filename = 'instances.toml') {
    return new Promise((resolve, reject) => {
      let config_path = this.profileManager.getConfigPath(filename);
      this.log.info(util.format('Loading instances from %s', config_path));
      fs.readFile(config_path, (err, data) => {
        if (err) {
          this.log.error(util.format('Failed to load instances from %s: %s', config_path, err.message));
          reject(util.format('Failed to load instances from %s: %s', config_path, err.message));
        } else {
          let config = toml.parse(data.toString());
          for (let instanceId of Object.keys(config.instances)) {
            this.create(
              instanceId,
              config.instances[instanceId].type,
              config.instances[instanceId].name,
              config.instances[instanceId].description,
              false,
              config.instances[instanceId].autostart,
              config.instances[instanceId].autorestart
            ).then((instanceNode) => {
              if (instanceNode.autostart) {
                this.start(instanceNode).then((instanceNode) => {
                  this.connect(instanceNode).then((instanceNode) => {
                    this.log.info(util.format('Instance %s is up and running', instanceNode.getName()));
                  }).catch((err) => {
                    this.log.error(util.format('Failed to autoconnect to instance %s', instanceNode.getName()));
                  });
                }).catch((err) => {
                  this.log.error(util.format('Failed to autostart to instance %s', instanceNode.getName()));
                });
              }
            }).catch((err) => {
            });
          }
          resolve(true);
        }
      });
    });
  }

  /**
   * Saves an instance to a TOML file.
   * @function
   * @param {string} [filename] - The filename.
   * @return {Promise<bool>}
   */
  saveInstances(filename = 'instances.toml') {
    return new Promise((resolve, reject) => {
      let config_path = this.profileManager.getConfigPath(filename);
      let instanceIds = this.instancesNode.getChildNames();
      let config = {
        instances: {}
      };
      for (var i = 0; i < instanceIds.length; i++) {
        let instanceId = instanceIds[i];
        let instanceNode = this.instancesNode.getChild(instanceId);
        config.instances[instanceId] = {
          'type': instanceNode.type,
          'name': instanceNode.name,
          'description': instanceNode.description,
          'autostart': instanceNode.autostart,
          'autorestart': instanceNode.autorestart
        };
      }
      var toml = tomlify(config, {delims: false});
      this.log.info(toml);
      fs.writeFile(config_path, toml, (err) => {
        if (err) {
          this.log.warn(util.format('Failed to write instances to %s: %s', config_path, err.message));
          reject(util.format('Failed to write instances to %s: %s', config_path, err.message));
        } else {
          this.log.info(util.format('Wrote instances to %s', config_path));
          resolve(true);
        }
      }); 
    });
  }

  /**
   * Returns true if the given instance type is a valid type.
   * @function
   * @param {string} [instance_type] - The instance type.
   * @return {boolean} - True if the given instance type is a valid type.
   */
  isValidInstanceType(instance_type) {
    return instance_types.includes(instance_type);
  }

  /**
   * Applies a state transition on an instance.
   * @function
   * @param {tree.Node} [instanceNode] - The instance on which the transition should apply.
   * @param {string} [oldState] - The old state.
   * @param {string} [newState] - The new state.
   * @return {boolean} - True if the given state transition is valid.
   */
  transist(instanceNode, oldState, newState) {
    if (instance_states.includes(oldState)) {
      if (instance_states.includes(newState)) {
        if (instanceNode.state == oldState) {
          if (this.isValidTransition(oldState, newState)) {
            instanceNode.state = newState;
            this.log.info(util.format('%s changes state: %s ---> %s', this.getInstanceName(instanceNode), oldState, newState));
            return true;
          } else {
            this.log.error(util.format('%s ---> %s is not a valid transition', oldState, newState));
            return false;
          }
        } else {
          this.log.error(util.format('Source state of %s is not %s', this.getInstanceName(instanceNode), oldState));
          return false;
        }
      } else {
        this.log.error(util.format('%s is not a valid state', oldState));
        return false;
      }
    } else {
      this.log.error(util.format('%s is not a valid state', newState));
      return false;
    }
  }

  /**
   * Returns true if the given state transition is valid.
   * @function
   * @param {string} [oldState] - The old state.
   * @param {string} [newState] - The new state.
   * @return {boolean} - True if the given state transition is valid.
   */
  isValidTransition(oldState, newState) {
    for (var i = 0; i < instance_transitions.length; i++) {
      if (instance_transitions[i].oldState == oldState && instance_transitions[i].newState == newState) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns an array of instance ids which the given state.
   * @function
   * @param {string} [state] - The state.
   * @return {array} - The list of instance ids.
   */
  getInstancesByType(type) {
    let instanceIdsOfType = [];
    let instanceIds = this.instancesNode.getChildNames();
    instanceIds.forEach(function(instanceId) {
      if (this.instancesNode.getChild(instanceId).type == type) {
        instanceIdsOfType.push(instanceId);
      }
    });
    return instanceIdsOfType;
  }

  /**
   * Returns an array of instance ids which the given state.
   * @function
   * @param {string} [state] - The state.
   * @return {array} - The list of instance ids.
   */
  getInstancesByState(state) {
    let instanceIdsWithState = [];
    let instanceIds = this.instancesNode.getChildNames();
    instanceIds.forEach(function(instanceId) {
      if (this.instancesNode.getChild(instanceId).state == state) {
        instanceIdsWithState.push(instanceId);
      }
    });
    return instanceIdsWithState;
  }

  getInstanceName(instanceNode) {
    return util.format('%s instance %s', instanceNode.type, instanceNode.getName());
  }

}

module.exports = {
  InstanceManager: InstanceManager,
  instance_types: instance_types,
  instance_states: instance_states,
  instance_transitions: instance_transitions,
  default_instance_type: default_instance_type,
  default_instance_state: default_instance_state,
  default_instance_ports: default_instance_ports,
}
