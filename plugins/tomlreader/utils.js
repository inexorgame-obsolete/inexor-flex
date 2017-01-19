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

module.exports = {
  withinDirectory: withinDirectory,
  isInMediaOrConfigDirectory: isInMediaOrConfigDirectory,
  readConfigFile: readConfigFile
}
