/**
 * @module path
 * // TODO: Might be better called inexorgame/defaults
 */

const os = require('os');
const process = require('process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const standardPaths = require('./standardpaths');

/**
 * The path of the flex folder
 * @property {string} flex_path
 */
const flex_path = process.env.PWD; // This should not change

/**
 * The pid file that Inexor Flex uses
 * NOTE: Might be prefixed with /inexor in the future
 */
const pid_path =  (process.env.PID_PATH) ? path.resolve(process.env.PID_PATH) : path.resolve(standardPaths.tempLocation);

/**
 * The config folder of flex
 * By default the XDG config path is used. This can be overwritten by the
 * environment variable CONFIG_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 * @property {string} config_path
 */
const config_path = (process.env.CONFIG_PATH) ? process.env.CONFIG_PATH : standardPaths.appConfigLocation[0];

/**
 * The media directory of inexor
 * By default the XDG data path is used. This can be overwritten by the
 * environment variable MEDIA_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 * @property {string} media_path
 */
const media_path = (process.env.MEDIA_PATH) ? process.env.MEDIA_PATH : path.join(standardPaths.appDataLocation[0], 'media');

/**
 * The releases path of inexor
 * By default the app data location + 'releases' is used
 * @property {string} releases_path
 */
const releases_path = (process.env.RELEASES_PATH) ? process.env.RELEASES_PATH : path.join(standardPaths.appDataLocation[0], 'releases');

/**
 * Returns the binary directory of an Inexor installation.
 * Can be overwritten with the environment variable BINARY_PATH (absolute path)
 * @return {string}
 */
function getBinaryPath() {
  if (process.env.BINARY_PATH) {
    return path.resolve(process.env.BINARY_PATH);
  }

  let binpaths = ['../bin', 'bin'];
  binpaths.push(path.resolve(path.join(standardPaths.appDataLocation[0], 'bin')));

  binpaths.forEach((binpath) => {
    if (fs.existsSync(path.join(flex_path, binpath))) {
      return path.resolve(path.join(flex_path, binpath))
    }
  })
}

/**
 * Returns the absolute path to the InexorCore executable.
 *
 * @return {string}
 */
function getExecutablePath(instance_type) {
  let platform = os.platform();
  let binary_name = util.format("inexor-core-%s.exe", instance_type);
  return path.join(getBinaryPath(), binary_name);
}

/**
 * Returns a preference-ordered array of base directories to search for media
 * files in addition to the default media path.
 * @return {string}
 */
function getMediaPaths() {
  var media_paths = [];
  for (var i = 0; i < standardPaths.appDataLocation.length; i++) {
    media_paths.push(path.join(standardPaths.appDataLocation[i], 'media'));
  }
  return media_paths;
}

/**
 * Returns a preference-ordered array of base directories to search for
 * configuration files in addition to the default config path.
 * @return {string}
 */
function getConfigPaths() {
  return standardPaths.appConfigLocation;
}

/**
 * The default port of Inexor Flex to use
 * @property {number} DEFAULT_PORT
 */
const DEFAULT_PORT = 31416;

module.exports = {
  standardPaths: standardPaths,
  flex_path: flex_path,
  pid_path: pid_path,
  config_path: config_path,
  media_path: media_path,
  releases_path: releases_path,
  getBinaryPath: getBinaryPath,
  getExecutablePath: getExecutablePath,
  getMediaPaths: getMediaPaths,
  getConfigPaths: getConfigPaths,
  DEFAULT_PORT: DEFAULT_PORT
};
