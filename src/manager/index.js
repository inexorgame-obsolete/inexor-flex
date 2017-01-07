/**
 * Is responsible for starting and handling of Inexor Core instances.
 * @module manager
 */

const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const portastic = require('portastic');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const tree = require('@inexor-game/tree');

var log = bunyan.createLogger({
	name: '@inexor-game/manager',
	streams: [{
 		level: 'debug',
 		type: 'raw',
 		stream: bunyanDebugStream({
 			forceColor: true
 		})
	}],
	serializers: bunyanDebugStream.serializers
});

// The default port to use
const defaultPort = 31415;

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
 * @param {string} args
 * @param {number} [identifier] - the instance identifier
 * @param {number} [port] - the port to bind to
 * @param {tree.Root} [t] - the configuration tree
 * @return {Promise<manager.instance>}
 */
function create(args, identifier = null, port = null, t = null) {
	log.debug('Creating instance ' + identifier + ' on port ' + port);
  return new Promise((resolve, reject) => {
    let instance = {};
    instance.args = args;

  	// Either use the given Inexor Tree or create a new tree for this
    // instance of Inexor Core.
    instance.tree = t; // Is null if no tree is specified
    if (t == null) {
      instance.tree = new tree.Root();
    }

    // Resolve the port
    let _port = null;
    if (port == null && identifier == null) {
      try {
        portastic.find({min: defaultPort, max: defaultPort + 1000}).then((ports) => {
          if (array.length < 0) {
          	log.warn('No open port found');
            throw new Error('No open port found'); // This should never happen, honestly.
          } else {
            identifier = ports[0];
            _port = identifier;
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
function start(instance) {
	log.debug('Starting instance ' + instance.id);

  // Since the manager is not responsible for handling executable paths, we premise that
  // a command string exists at global.binary_path;

  return new Promise((resolve, reject) => {
  	try {
  	  // let flex_dir = process.cwd();
      // let flex_dir = path.join(__dirname, '../../..');
//      let flex_dir = path.resolve('.');
//      log.info('flex_dir = ' + path.resolve(flex_dir));
      log.info('flex_path = ' + flex_path);
  	  let base_path = path.join(global.flex_path, '..');
  	  log.info('base_path = ' + path.resolve(base_path));
      let binary_path = path.join(base_path, 'bin');
      log.info('binary_path = ' + path.resolve(binary_path));
      // TODO: platform specific binary path
      let binary_exe = path.join(binary_path, 'inexor');
      log.info('binary_exe = ' + path.resolve(binary_exe));
      let media_path = path.join(base_path, 'media');
      log.info('media_path = ' + path.resolve(media_path));
      let media_repositories = get_sub_directories(media_path);
      let args = [];
      args.push('-q~/.inexor');
      if (instance.args.length > 0) {
        args.push(instance.args);
      }
      // args.push('-k' + path.resolve(media_path));
      media_repositories.forEach(function(media_repository) {
        var media_dir = path.join(media_path, media_repository);
        // args.push('-k' + path.resolve(media_dir));
        args.push('-k./media/' + media_repository);
      }); 
      let options = {
        cwd: path.resolve(base_path)
      };
      log.info(args);
      log.info('Starting ' + binary_exe + ' ' + args.join(' '));
      instance._process = spawn(binary_exe, args, options);
      instance._process.on('error', (err) => {
      	log.error('Error on instance ' + instance.id + ': ' + err.message);
        throw new Error(err); // This should be instantly fired
      });
      instance._process.stdout.on('data', function(data) {
        log.debug(String(data));
      });
      instance._process.stderr.on('data', function(data) {
        log.debug(String(data));
      });
      instance._process.on('exit', function(code) {
        log.debug('child process exited with code ' + String(code));
      });
  	} catch (err) {
  		log.error(err.message);
  		throw new Error(err);
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
	log.debug('Stopping instance ' + instance.id);
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
