/**
 * Is responsible for starting and handling of Inexor Core instances.
 * @module manager
 */

const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const portastic = require('portastic');
const util = require('util');
const debuglog = util.debuglog('manager');
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

// The default port to use
const defaultPort = 31417;

/**
 * An Inexor Core instance defines the meta information about an client or server instance.
 * @typedef {Object} instance
 * @property {number} id - the instance identifier
 * @property {string} args - the command line arguments to supply to Inexor Core
 * @property {tree.Root} tree - the tree associated with the instance
 */

/**
 * Creates an instance of Inexor Core. The instance is created but not started!
 * @function
 * @param {Node} the instances node
 * @param {string} args
 * @param {number} [identifier] - the instance identifier
 * @param {number} [port] - the port to bind to
 * @param {tree.Root} [t] - the configuration tree
 * @return {Promise<manager.instance>}
 */
function create(instances_node, identifier = null, port = null, type = null, name = null, description = null) {
  return new Promise((resolve, reject) => {
    // TODO: identifier must not be null!
    let instance_node = instances_node.addNode(String(identifier));

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

function get_sub_directories(_path) {
  return fs.readdirSync(_path).filter(function(file) {
    return fs.statSync(path.join(_path, file)).isDirectory();
  });
}

/**
 * Starts an instance and returns the instance with a child_process attached
 * @function
 * @param {manager.instance}
 * @return {Promise<instance>}
 */
function start(instance_node) {
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

      let args = [ instance_id ];
      let options = {
        cwd: path.resolve(base_path)
      };
      debuglog(args);
      debuglog('Starting ' + binary_path + ' ' + args.join(' '));
      
      // Spawn process and add process node
      let process = spawn(binary_path, args, options);
      process.on('error', (err) => {
        debuglog('Error on instance ' + instance_id + ': ' + err.message);
        throw new Error(err); // This should be instantly fired
      });
      process.stdout.on('data', function(data) {
        debuglog(String(data));
      });
      process.stderr.on('data', function(data) {
        debuglog(String(data));
      });
      process.on('exit', function(code) {
        debuglog('Child process exited with code ' + String(code));
      });

      // Store the process handle
      let process_node = instance_node.addChild('process', 'object', process);
      
      debuglog('Process has been started: ' + binary_path + ' ' + args.join(' '));
      
      
      
//      let connection = 'localhost:' + instance_port;
//      debuglog('connection: ' + connection);
//      let tree_service_client = new root.grpc.protoDescriptor.inexor.tree.TreeService(connection, grpc.credentials.createInsecure());
//      let synchronize = tree_service_client.synchronize();
//      let grpc = instance_node.getChild('grpc').get();
//      let root = instance_node.getParent().getParent();
//      // Update the local tree
//      synchronize.on('data', function(message) {
//        try {
//          let protoKey = message.key;
//          let value = message[protoKey];
//          let path = grpc.getPath(protoKey);
//          let node = root.findNode(path);
//          if (protoKey != '__numargs') {
//            debuglog('protoKey = "' + protoKey + '" path = "' + path + '" value = "' + value + '"');
//          }
//          // Use setter and prevent sync!
//          node.set(value, true);
//        } catch (err) {
//          debuglog(err);
//        }
//      });
//      synchronize.on('end', function() {
//        debuglog('inexor.tree.grpc.synchronize.end');
//      });
//      synchronize.on('status', function(status) {
//        debuglog('inexor.tree.grpc.synchronize.status: ' + status);
//      });
//      instance_node.setSynchronize(synchronize);
//      let tree_service_client_node = instance_node.addChild('tree_service_client', 'object', tree_service_client);
//
//      // now synchronize the created tree
//      let sync_node_recursive = function(node) {
//        if (node != instance_node) {
//          let message = {};
//          message[._protoKey] = value;
//          synchronize.write(message);
//        }
//        let child_names = node.getChildNames();
//        for (var i = 0; i < child_names.length; i++) {
//          let child_name = child_names[i];
//          sync_node_recursive(node.getChild(child_name));
//        }
//      };
//      sync_node_recursive(instance_node);
//      
//      let child_names = instance_node.getChildNames();
//      for (var i = 0; i < child_names.length; i++) {
//        let child_name = child_names[i];
//        sync_node_recursive(instance_node.getChild(child_name));
//      }
//      
//      tree_service_client
//      // TODO: wait for process started
//
//
//      // TODO:
//      /*
//      root.grpc.synchronize.on("data", function(message) {
//        try {
//              let protoKey = message.key;
//              let value = message[protoKey];
//              let path = root.grpc.getPath(protoKey);
//              let node = root.findNode(path);
//              if (protoKey != "__numargs") {
//                  server.log.debug("protoKey = " + protoKey + " path = \"" + path + "\" value = " + value);
//              }
//              // Use setter and prevent sync!
//              node.set(value, true);
//        } catch (err) {
//          server.log.error(err);
//        }
//      });
//      */
      
      
      instance_node.state = 'started';
      resolve(instance_node);
  	} catch (err) {
  		debuglog(err.message);
  		throw new Error(err);
  	}
  })
}

/**
 * Stops an instance
 * @function
 * @param {manager.instance}
 * @return {Promise<bool>}
 */
function stop(instance) {
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

module.exports = {
  create: create,
  start: start,
  stop: stop
}
