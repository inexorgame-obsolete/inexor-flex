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

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

const debuglog = util.debuglog('instances');
const log = require('@inexor-game/logger')();

/**
 * The list of instance types.
 * @constant {number}
 */
const instance_types = [
  'server',
  'client'
]

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
  { 'name': 'create',     'old_state': null,      'new_state': 'stopped' },
  { 'name': 'start',      'old_state': 'stopped', 'new_state': 'started' },
  { 'name': 'connect',    'old_state': 'started', 'new_state': 'running' },
  { 'name': 'pause',      'old_state': 'running', 'new_state': 'paused'  },
  { 'name': 'resume',     'old_state': 'paused',  'new_state': 'running' },
  { 'name': 'disconnect', 'old_state': 'running', 'new_state': 'started' },
  { 'name': 'stop',       'old_state': 'started', 'new_state': 'stopped' },
  { 'name': 'destroy',    'old_state': 'stopped', 'new_state': null      }
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
  constructor(application_context) {
    super();

    var root = application_context.get('tree');

    /** @private */
    this._instances_node = root.getOrCreateNode('instances');

    // Load instances.toml
    this.loadInstances();
  }

  /**
   * Returns if an instance with the given identifier exists.
   * @function
   * @param {number} [instance_id] - the instance identifier
   * @return {boolean} - True, if the instance exists.
   */
  exists(instance_id) {
    return this._instances_node.hasChild(instance_id);
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
   * @return {Promise<tree.Node>} - the tree node which represents the instance
   */
  create(identifier = null, type = default_instance_type, name = '', description = '', persistent = false, autostart = false) {
    return new Promise((resolve, reject) => {
      if (identifier == null) {
        reject(new Error('Failed to create instance: No identifier'));
      } else if (this._instances_node.hasChild(String(identifier))) {
        reject(new Error('Failed to create instance: Instance already exists'));
      }

      // Create the instance sub tree
      let instance_node = this._instances_node.addNode(String(identifier));

      // Start with state 'stopped'
      instance_node.addChild('state', 'string', default_instance_state);

      // The instance type, e.g. 'client', 'server', ...
      instance_node.addChild('type', 'string', type);

      // The name of the instance, e.g. 'Client 1'
      instance_node.addChild('name', 'string', name);

      // The description of the instance, e.g. 'The default client'
      instance_node.addChild('description', 'string', description);

      // The port of the GRPC server
      instance_node.addChild('port', 'int64', identifier);

      // The port of the GRPC server
      instance_node.addChild('autostart', 'bool', autostart);

      // Save instances.toml
      if (persistent) {
        // TODO: save only the current instance
        this.saveInstances();
      }

      resolve(instance_node);
    });
  }

  /**
   * Removes an instance.
   * @function
   * @param {tree.Node} [instance_node] - The instance to start.
   * @return {Promise<instance>}
   */
  remove(instance_node) {
    return new Promise((resolve, reject) => {
      // TODO: only if state is
    });
  }

  /**
   * Starts an instance.
   * @function
   * @param {tree.Node} [instance_node] - The instance to start.
   * @return {Promise<instance>}
   */
  start(instance_node) {
    let instance_id = instance_node.getName();
    let instance_port = instance_node.port;
    let instance_type = instance_node.type;
  	log.info('Starting instance ' + instance_node.name + ' (id: ' + instance_id + ', type: ' + instance_type + ', port: ' + instance_port + ')');
  
    return new Promise((resolve, reject) => {
      
      // Resolve executable
      let executable_path = inexor_path.getExecutablePath(instance_type)
      if (!fs.existsSync(executable_path)) {
        reject(new Error('Executable does not exist: ' + executable_path));
      }

      // Starting a new process with the instance id as only argument
      let args = [ instance_id ];
      let options = {
        cwd: path.resolve(inexor_path.getBasePath()),
        env: process.env
      };
      log.info(util.format('Starting %s %s', executable_path, args.join(' ')));
      
      // Spawn process
      let instance_process = spawn(executable_path, args, options);
      instance_process.stdout.on('data', this.mapStreamToLog);
      instance_process.stderr.on('data', this.mapStreamToLog);
      instance_process.on('error', (err) => {
        instance_node.removeChild('process');
        this.transist(instance_node, 'running', 'started');
        this.transist(instance_node, 'started', 'stopped');
        if (err != null) {
          log.error(util.format('Error in %s: %s', this.getInstanceName(instance_node), err.message));
        }
      });
      instance_process.on('exit', (code, signal) => {
        instance_node.removeChild('process');
        this.transist(instance_node, 'running', 'started');
        this.transist(instance_node, 'started', 'stopped');
        if (code != null) {
          log.info(util.format('Child process exited with code %d', code));
        } else if (signal != null) {
          log.info(util.format('Child process exited with signal %s', signal));
        }
      });

      // Store the PID and the process handle
      instance_node.addChild('pid', 'int64', instance_process.pid);
      instance_node.addChild('process', 'object', instance_process);

      log.info(util.format('%s started with PID %d', this.getInstanceName(instance_node), instance_process.pid));

      this.transist(instance_node, 'stopped', 'started');
      resolve(instance_node);

    });
  }

  /**
   * Stops an instance.
   * @function
   * @param {tree.Node} [instance_node] - The instance to stop.
   * @return {Promise<tree.Node>}
   */
  stop(instance_node) {
    return new Promise((resolve, reject) => {
      log.info(util.format('Stopping instance %s', this.getInstanceName(instance_node)));
      // SIGTERM
      instance_node.getChild('process').get().kill();
      // not needed should happen automatically
      // this.transist(instance_node, 'stopped', 'started');
      resolve(instance_node);
    });
  }

  /**
   * Pauses a running instance.
   * @function
   * @param {tree.Node} instance_node - The instance to stop.
   * @return {Promise<tree.Node>}
   */
  pause(instance_node) {
    return new Promise((resolve, reject) => {
      this.transist(instance_node, 'running', 'paused');
      resolve(instance_node);
    });
  }

  /**
   * Resumes a paused instance.
   * @function
   * @param {tree.Node} instance_node - The instance to stop.
   * @return {Promise<bool>}
   */
  resume(instance_node) {
    return new Promise((resolve, reject) => {
      this.transist(instance_node, 'paused', 'running');
      resolve(true);
    });
  }

  /**
   * Starts all available instances
   * @function
   * @return {Promise<bool>}
   */
  startAll() {
    return new Promise((resolve, reject) => {
      let instance_ids = this._instances_node.getChildNames();
      instance_ids.forEach(function(instance_id) {
        this.start(this._instances_node.getChild(instance_id));
      });
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
      let instance_ids = this._instances_node.getChildNames();
      instance_ids.forEach(function(instance_id) {
        this.stop(this._instances_node.getChild(instance_id));
      });
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
      let config_path = this.getConfigPath(filename);
      log.info(util.format('Loading instances from %s', config_path));
      fs.readFile(config_path, (err, data) => {
        if (err) {
          log.error(util.format('Failed to load instances from %s: %s', config_path, err.message));
          reject(util.format('Failed to load instances from %s: %s', config_path, err.message));
        } else {
          let config = toml.parse(data.toString());
          for (let instance_id of Object.keys(config['instances'])) {
            this.create(
              instance_id,
              config['instances'][instance_id]['type'],
              config['instances'][instance_id]['name'],
              config['instances'][instance_id]['description'],
              false,
              config['instances'][instance_id]['autostart']
            ).then((instance_node) => {
              if (instance_node.autostart) {
                this.start(instance_node);
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
   * @param {tree.Node} instance_node - The instance to save.
   * @param {string} [filename] - The filename.
   * @return {Promise<bool>}
   */
  saveInstances(filename = 'instances.toml') {
    return new Promise((resolve, reject) => {
      let config_path = this.getConfigPath(filename);
      let instance_ids = this._instances_node.getChildNames();
      let config = {
        instances: {}
      };
      for (var i = 0; i < instance_ids.length; i++) {
        let instance_id = instance_ids[i];
        let instance_node = this._instances_node.getChild(instance_id);
        config['instances'][instance_id] = {
          'type': instance_node.type,
          'name': instance_node.name,
          'description': instance_node.description,
          'autostart': instance_node.autostart
        };
      }
      var toml = tomlify(config, {delims: false});
      log.info(toml);
      fs.writeFile(config_path, toml, (err) => {
        if (err) {
          log.warn(util.format('Failed to write instances to %s: %s', config_path, err.message));
          reject(util.format('Failed to write instances to %s: %s', config_path, err.message));
        } else {
          log.info(util.format('Wrote instances to %s', config_path));
          resolve(true);
        }
      }); 
    });
  }

  /**
   * Returns the config path for the instances configuration file.
   * @function
   * @param {string} [filename] - The filename.
   */
  getConfigPath(filename = 'instances.toml') {
    let config_paths = inexor_path.getConfigPaths();
    for (var i = 0; i < config_paths.length; i++) {
      let config_path = path.join(config_paths[i], filename);
      if (fs.existsSync(config_path)) {
        return config_path;
      }
    }
    return path.join(config_paths[0], filename);
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
   * @param {tree.Node} [instance_node] - The instance on which the transition should apply.
   * @param {string} [old_state] - The old state.
   * @param {string} [new_state] - The new state.
   * @return {boolean} - True if the given state transition is valid.
   */
  transist(instance_node, old_state, new_state) {
    if (instance_states.includes(old_state)) {
      if (instance_states.includes(new_state)) {
        if (instance_node.state == old_state) {
          if (this.isValidTransition(old_state, new_state)) {
            instance_node.state = new_state;
            log.info(util.format('%s changes state: %s ---> %s', this.getInstanceName(instance_node), old_state, new_state));
            return true;
          } else {
            log.error(util.format('%s ---> %s is not a valid transition', old_state, new_state));
            return false;
          }
        } else {
          log.error(util.format('Source state of %s is not %s', this.getInstanceName(instance_node), old_state));
          return false;
        }
      } else {
        log.error(util.format('%s is not a valid state', old_state));
        return false;
      }
    } else {
      log.error(util.format('%s is not a valid state', new_state));
      return false;
    }
  }

  /**
   * Returns true if the given state transition is valid.
   * @function
   * @param {string} [old_state] - The old state.
   * @param {string} [new_state] - The new state.
   * @return {boolean} - True if the given state transition is valid.
   */
  isValidTransition(old_state, new_state) {
    for (var i = 0; i < instance_transitions.length; i++) {
      if (instance_transitions[i].old_state == old_state && instance_transitions[i].new_state == new_state) {
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
    let instance_ids_of_type = [];
    let instance_ids = this._instances_node.getChildNames();
    instance_ids.forEach(function(instance_id) {
      if (this._instances_node.getChild(instance_id).type == type) {
        instance_ids_of_type.push(instance_id);
      }
    });
    return instance_ids_of_type;
  }

  /**
   * Returns an array of instance ids which the given state.
   * @function
   * @param {string} [state] - The state.
   * @return {array} - The list of instance ids.
   */
  getInstancesByState(state) {
    let instance_ids_with_state = [];
    let instance_ids = this._instances_node.getChildNames();
    instance_ids.forEach(function(instance_id) {
      if (this._instances_node.getChild(instance_id).state == state) {
        instance_ids_with_state.push(instance_id);
      }
    });
    return instance_ids_with_state;
  }

  /**
   * Redirects stdout / stderr streams to logging.
   * @function
   * @param {stream} data - The stream data.
   * @return {Promise<bool>}
   */
  mapStreamToLog(data) {
    for (var line of data.toString('utf8').split("\n")) {
      if (line.includes('[info]')) {
        log.info(line);
      } else if (line.includes('[warn]')) {
        log.error(line);
      } else if (line.includes('[error]')) {
        log.error(line);
      } else {
        log.debug(line);
      }
    }
  }

  getInstanceName(instance_node) {
    return util.format('%s instance %s', instance_node.type, instance_node.getName());
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

