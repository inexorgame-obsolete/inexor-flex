/**
 * Is responsible for starting and handling of Inexor Core instances.
 * @module manager
 */

const spawn = require('child_process').spawn;
const portastic = require('portastic');
const tree = require('@inexor-game/tree');

// The default port to use
const defaultPort = 31415;

/**
 * A Inexore Core instance
 * @typedef {Object} instance
 * @property {number} id - the instance identifier
 * @property {string} args - the command line arguments to supply to Inexor Core
 * @property {tree.Root} tree - the tree associated with the instance
 */

/**
 * Creates an instance
 * @function
 * @param {string} args
 * @param {number} [identifier] - the instance identifier
 * @param {number} [port] - the port to bind to
 * @param {tree.Root} [t] - the configuration tree
 * @return {Promise<manager.instance>}
 */
function create(args, identifier=null, port=null, t=null) {
  return new Promise((resolve, reject) => {
    let instance = {};
    instance.tree = tree; // Is null if no tree is specified
    let _port = null;

    if (tree == null) {
      instance.tree = new tree.Root();
    }

    if (port == null && identifier == null) {
      identifier = defaultPort // TODO: choose a random port
    } else if (port == null && identifier != null) {
      _port = identifier;
    } else {
      _port = port;
    }

    portastic.test(_port).then((isOpen) => {
      if (isOpen) {
        instance.id = identifier;
        instance.port = _port;
        resolve(instance);
      } else {
        throw new Error('EADDRINUSE, Address already in use.');
      }
    })
  })
}

/**
 * Starts an instance and returns the instance with a child_process attached
 * @function
 * @param {manager.instance}
 * @return {Promise<instance>}
 */
function start(instance) {
  // Since the manager is not responsible for handling executable paths, we premise that
  // a command string exists at global.binary_path;

  return new Promise((resolve, reject) => {
    instance._process = spawn(global.binary_path, instance.args);
    instance._process.on('error') = (err) => {
      throw new Error(err); // This should be instantly fired
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
      throw new Error(err);
    }

    instance._process.kill(); // SIGTERM
  })
}

module.exports = {
  create, create,
  start: start,
  stop: stop
}
