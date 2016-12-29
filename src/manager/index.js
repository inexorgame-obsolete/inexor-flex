/**
 * Is responsible for starting and handling of Inexor Core instances.
 * @module manager
 */

const spawn = require('child_process').spawn;
const portastic = require('portastic');

// The default port to use
const defaultPort = 28985;

/**
 * A Inexore Core instance
 * @typedef {Object} instance
 * @property {string} args - the command line arguments to supply to Inexor Core
 * @property {number} port - either the instance identifier or a randomly choosen port
 * @property {tree.Root} tree - the tree associated with the instance
 */

/**
 * Creates an interface
 * @function
 * @param {string} args
 * @param {number} [identifier] - the interface identifier
 * @param {number} [port] - the port to bind to
 * @param {tree.Root} [tree] - the configuration tree
 * @return {Promise<manager.interface>}
 */
function create(args, identifier=null, port=null, tree=null) {
  return new Promise((resolve, reject) => {
    let instance = {};
    instance.tree = tree; // Is null if no tree is specified
    let _port = null;

    if (port == null) {
      // TODO: choose a random port
    } else {
      _port = port;
    }

    portastic.test(_port).then((isOpen) {
      if (isOpen) {
        interface.port = _port;
        resolve(interface);
      } else {
        reject(new Error('EADDRINUSE, Address already in use.'))
      }
    })
  }
}

/**
 * Starts an instance and returns the instance with a child_process attached
 * @function
 * @param {manager.interface}
 * @return {Promise<interface>}
 */
function start(instance) {
  // Since the manager is not responsible for handling executable paths, we premise that
  // a command string exists at global.command;

  return new Promise((resolve, reject) => {
    instance._process = spawn(global.command, interface.args);
    instance._process.on('error') = (err) => {
      reject(err); // This should be instantly fired
    }
    resolve(instance);
  })
}

/**
 * Stops an instance
 * @function
 * @param {manager.instance}
 * @return {Promise<bool>}
 */
function stop(instance) {
  return new Promise((resolve, reject) => {
    instance._process.on('close', (code, signal) => {
      resolve(`Child process terminated due to receipt of signal ${signal}`)
    })
    instance._process.on('error') = (err) => {
      reject(err);
    }

    instance._process.kill(); // SIGTERM
  })
}

module.exports = {
  create, create,
  start: start,
  stop: stop
}
