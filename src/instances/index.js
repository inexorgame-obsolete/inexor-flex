/**
 * This module is responsible for starting and handling of Inexor Core instances.
 * @module instances
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const portastic = require('portastic');
const spawn = require('child_process').spawn;
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

const debuglog = util.debuglog('instances');
const log = require('@inexor-game/logger')();

// The default port to use
const defaultPort = 31417;

const instance_states = [
  'stopped',
  'started',
  'connected',
  'running',
  'paused'
];

// TODO: Define separate port ranges for each instance type
// TODO: Define the default instance type ('client')

/**
 * Manages instances.
 * TODO: state machine
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
    
    this.load();
  }

  transist(instance_node, new_state) {
    // if new_state in this._states {
    instance_node.state = new_state;
  }

  get_instances_by_state(state) {
    // TODO: implement
    return [];
  }

  load() {
    // TODO: implement
    // Load instances from TOML or JSON file
  }

  /**
   * Returns if an instance with the given identifier exists.
   * @function
   * @param {number} [identifier] - the instance identifier
   * @return {boolean} - True, if the instance exists.
   */
  exists(identifier) {
    return this._instances_node.hasChild(identifier);
  }

  /**
   * Creates an instance of Inexor Core. The instance is created but not started!
   * @function
   * @param {number} [identifier] - the instance identifier
   * @param {number} [port] - the port to bind to
   * @param {string} [type] - the instance type - either server or client
   * @param {string} [name] - the name of the instance
   * @param {string} [description] - the description of the instance
   * @return {Promise<tree.Node>} - the tree node which represents the instance
   */
  create(identifier = null, port = null, type = null, name = null, description = '') {
    return new Promise((resolve, reject) => {
      // TODO: Identifier must not be null!
      // TODO: New behaviour: Use the instance id as port. No port resolving needed if the instance id is given.
      // TODO: Resolve the default port by instance type
      // TODO: Resolve the default name by instance type, something like 'Inexor Client (id)'
      let instance_node = this._instances_node.addNode(String(identifier));
  
      // Initialize the instance sub tree
  
      // Start with state 'stopped'
      // TODO: create a constant list of allowed instance states ('stopped', 'started', 'connected', 'running', 'paused')
      // TODO: document the states in the wiki
      instance_node.addChild('state', 'string', 'stopped');
  
      // The type, e.g. 'client', 'server', ...
      // TODO: create a constant list of allowed instance types
      instance_node.addChild('type', 'string', type);
  
      // The name of the instance, e.g. 'Client 1'
      instance_node.addChild('name', 'string', name);
  
      // The description of the instance, e.g. 'The default client'
      instance_node.addChild('description', 'string', description);
  
      /**
       * @private
       * Reduce DRY code
       */
      let resolvePort = function(port) {
        portastic.test(_port).then((isOpen) => {
          if (isOpen) {
            instance_node.addChild('port', 'int64', _port);
            debuglog('Creating instance ' + identifier + ' on port ' + _port);
            resolve(instance_node);
          } else {
            throw new Error('EADDRINUSE, Address already in use.');
          }
        })
      }
  
      // Resolve the port
      let _port = null;
      // TODO: might need moarr asynchronisation
      if (port == null && identifier == null) {
        try {
          portastic.find({min: defaultPort, max: defaultPort + 1000}).then((ports) => {
            if (array.length < 0) {
            	debuglog('No open port found');
              throw new Error('No open port found'); // This should never happen, honestly.
            } else {
              identifier = ports[0];
              _port = identifier;
              resolvePort(_port);
            }
          })
        } catch (e) {
          throw new Error('Failed to find an open port: ' + e.message);
        }
      } else if (port == null && identifier != null) {
        _port = identifier;
      } else {
        _port = port;
      }
  
      resolvePort(_port);
    })
  }

  remove(instance_node) {
    // TODO: implement
  }

  get_sub_directories(_path) {
    return fs.readdirSync(_path).filter(function(file) {
      return fs.statSync(path.join(_path, file)).isDirectory();
    });
  }

  /**
   * Starts an instance and returns the instance with a child_process attached
   * @function
   * @param {tree.Node}
   * @return {Promise<instance>}
   */
  start(instance_node) {
    // debuglog(instance_node);
    let instance_id = instance_node.getName();
    let instance_port = instance_node.port;
    let instance_type = instance_node.type;
  	debuglog('Starting instance ' + instance_node.name + ' (id: ' + instance_id + ', type: ' + instance_type + ', port: ' + instance_port + ')');
  
    return new Promise((resolve, reject) => {
    	try {
        debuglog('flex_path = ' + inexor_path.flex_path);
        let base_path = inexor_path.getBasePath();
    	  debuglog('base_path = ' + path.resolve(base_path));
        let binary_path = path.join(base_path, inexor_path.binary_path);
        debuglog('binary_path = ' + path.resolve(binary_path));
        
        if (!fs.existsSync(binary_path)) {
          debuglog('Binary does not exist: ' + binary_path);
          throw new Error('Binary does not exist: ' + binary_path);
        }
  
  //    let media_path = path.join(base_path, inexor_path.media_path);
  //    debuglog('media_path = ' + path.resolve(media_path));
  //    let media_repositories = get_sub_directories(media_path);
  //    let args = [ node.getName() ];
  //      args.push('-q~/.inexor');
  //      if (instance.args.length > 0) {
  //        args.push(instance.args);
  //      }
  //      // args.push('-k' + path.resolve(media_path));
  //      media_repositories.forEach(function(media_repository) {
  //        var media_dir = path.join(media_path, media_repository);
  //        // args.push('-k' + path.resolve(media_dir));
  //        args.push('-k./media/' + media_repository);
  //      });
  
        // Starting an instance with the instance id as 
        let args = [ instance_id ];
        let options = {
          cwd: path.resolve(base_path)
        };
        debuglog(args);
        log.info('Starting ' + binary_path + ' ' + args.join(' '));
        
        // Spawn process and add process node
        let process = spawn(binary_path, args, options);
        process.on('error', (err) => {
          log.error('Error on instance ' + instance_id + ': ' + err.message);
          throw new Error(err); // This should be instantly fired
        });
  
        process.stdout.on('data', function(data) {
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
        });
  
        process.stderr.on('data', function(data) {
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
        });
  
        process.on('exit', function(code) {
          log.info('Child process exited with code ' + String(code));
          instance_node.state = 'stopped';
          // TODO: shutdown instance node!
        });
  
        // Store the process handle
        let process_node = instance_node.addChild('process', 'object', process);
        
        debuglog('Process has been started: ' + binary_path + ' ' + args.join(' '));
  
        instance_node.state = 'started';
        resolve(instance_node);

    	} catch (err) {
    		debuglog(err.message);
    		throw new Error(err);
    	}
    })
  }

  startAll() {
    // TODO: implement
  }

  /**
   * Stops an instance
   * @function
   * @param {instances.instance}
   * @return {Promise<bool>}
   */
  stop(instance) {
  	debuglog('Stopping instance ' + instance.id);
    return new Promise((resolve, reject) => {
      instance._process.on('close', (code, signal) => {
        resolve(`Child process terminated due to receipt of signal ${signal}`)
      })
      instance._process.on('error', (err) => {
        throw new Error(err);
      })
  
      instance._process.kill(); // SIGTERM
    })
  }

  stopAll() {
    // TODO: implement
  }

  pause(instance_node) {
    // TODO: implement
  }

  resume(instance_node) {
    // TODO: implement
  }

}

module.exports = InstanceManager
