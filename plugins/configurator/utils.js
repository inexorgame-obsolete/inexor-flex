const util = require('util');
const debuglog = util.debuglog('configurator');

// File system stuff
const tree = require('@inexor-game/tree');
const toml = require('toml');
//const glob = require('glob');
const fs = require('fs');
const path = require('path');
const inexor_path = require('@inexor-game/path');

// TODO: Might be re-used
const media_path = path.resolve(path.join(inexor_path.flex_path, inexor_path.media_path))
const config_path = path.resolve(path.join(inexor_path.flex_path, inexor_path.config_path))
// debuglog('The media directory is located at [%s]', media_path);
// debuglog('The config directory is located at [%s]', config_path);

/**
 * @module inexor-plugins/configurator
 * TODO: Add a seperate type conversion library for inexor !
 */

/**
 * Checks wether or not given path (file, directory) is in directory
 * NOTE: Could be ported to @inexor-game/path
 * @private
 * @function
 * @param  {string} path
 * @param  {string} directory
 * @return {boolean}
 */
function withinDirectory(_path, directory) {
  debuglog('Checking wether [%s] is in [%s]', _path, directory)
  return (_path.indexOf(directory) == 0);
}

/**
 * Checks wether or not a directory is in the media or config path
 * Checks absolute paths only at the moment.
 * @private
 * @function
 * @param  {[type]}  path [description]
 * @return {Boolean}      [description]
 */
function isInMediaOrConfigDirectory(_path) {
  return (withinDirectory(_path, media_path) || withinDirectory(_path, config_path));
}

/**
 * Returns a UNIX timestamp string for a given {Date}
 * @private
 * @function
 * @param {Date}
 * @return {string}
 */
function getUnixTime(date) {
  return date.getTime()/1000|0; // Taken from https://coderwall.com/p/rbfl6g/how-to-get-the-correct-unix-timestamp-from-any-date-in-javascript
}

/**
 * @private
 * Reads a TOML file
 * @param  {string} path
 * @return {Promise<Object>}
 */
function readConfigFile(_path) {
  return new Promise((resolve, reject) => {
    fs.readFile(_path, (err, data) => {
      if (err) reject(err);
      let str = data.toString();
      try {
        resolve(toml.parse(str));
      } catch (err) {
        reject(err);
      }
    })
  })
}

/**
 * Returns a {@link Node} for the given {Object}
 * @private
 * @function
 * @param {Object} obj
 * @param {Node} node [null] - used for recursion
 * @return {Node}
 */
function objectToTree(obj, node=null) {
  debuglog('Converting [%o]', obj);
  // Works quiet well since an Array is also in the property chain of an Object
  if (node != null) {
    debuglog('Received node [%o]', node)
    Object.entries(obj).forEach(([key, value]) => {
      debuglog('Processing [%o] with key [%s]', value, key)
      if (value instanceof Object && !(value instanceof Date)) {
        let _node = node.addNode(key);
        objectToTree(value, _node);
      } else {
        let type = (value instanceof Date) ? 'timestamp': typeof(value);
        if (type == 'number') {
          type = (tree.util.isInt(value)) ? 'int64': 'float';
        } else if (type == 'timestamp') {
          value = getUnixTime(value);
        } else if (type == 'boolean') {
          type = 'bool';
        }
        
        debuglog('Trying to add [%s] with type [%s]', value, type);
        node.addChild(key, type, value);
      }
    })
  } else {
    let root = new tree.Node(null, '/', 'node');

    debuglog('Added a new root node');
    Object.entries(obj).forEach(([key, value]) => {
      debuglog('Processing key %s', key)
      if (value instanceof Object && !(value instanceof Date)) {
        let _node = root.addNode(key);
        debuglog('Adding node with key [%s]', key);
        objectToTree(value, _node);
      } else {
        let type = (value instanceof Date) ? 'timestamp': typeof(value);
        if (type == 'number') {
          type = (tree.util.isInt(value)) ? 'int64': 'float';
        } else if (type == 'timestamp') {
          value = getUnixTime(value);
        } else if (type == 'boolean') {
          type = 'bool';
        }

        debuglog('Trying to add %s with type %s', value, type);
        root.addChild(key, type, value)
      }
    })

    return root;
  }
}

/*function treeToObject(tree) {

}*/

module.exports = {
  withinDirectory: withinDirectory,
  isInMediaOrConfigDirectory: isInMediaOrConfigDirectory,
  readConfigFile: readConfigFile,
  objectToTree: objectToTree
}
