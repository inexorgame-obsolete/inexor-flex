/**
 * @module path
 */

const process = require('process');
const path = require('path');
const standardPaths = require('./standardpaths');

/**
 * The path of the flex folder.
 * Developer note: DON'T change this or you'll break cross platform compatibility!
 * @property {string} flex_path
 */
let flex_path = process.env.PWD;
if (process.platform == 'win32') {
  flex_path = process.cwd()
}

/**
 * The pid file that Inexor Flex uses
 * NOTE: Might be prefixed with /inexor in the future
 */
const pid_path =  (process.env.INEXOR_PID_PATH) ? path.resolve(process.env.INEXOR_PID_PATH) : path.resolve(standardPaths.tempLocation);

/**
 * The config folder of flex
 * By default the XDG config path is used. This can be overwritten by the
 * environment variable CONFIG_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 * @property {string} config_path
 */
const config_path = (process.env.INEXOR_CONFIG_PATH) ? process.env.INEXOR_CONFIG_PATH : standardPaths.appConfigLocation[0];

/**
 * The media directory of inexor
 * By default the XDG data path is used. This can be overwritten by the
 * environment variable MEDIA_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 * @property {string} media_path
 */
const media_path = (process.env.INEXOR_MEDIA_PATH) ? process.env.INEXOR_MEDIA_PATH : path.join(standardPaths.appDataLocation[0], 'media');

/**
 * The releases path of inexor
 * By default the app data location is used
 * @property {string} releases_path
 */
const releases_path = (process.env.INEXOR_RELEASES_PATH) ? process.env.INEXOR_RELEASES_PATH : standardPaths.appDataLocation[0];

/**
 * The interfaces path of Inexor
 * By default the app data location + 'interfaces' is used
 * @property {string} interfaces_path
 */
const interfaces_path = (process.env.INEXOR_INTERFACES_PATH) ? process.env.INEXOR_INTERFACES_PATH : path.join(standardPaths.appDataLocation[0], 'interfaces');

/**
 * Returns a preference-ordered array of base directories to search for media
 * files in addition to the default media path.
 * @return {string}
 */
function getMediaPaths() {
  if (process.env.INEXOR_MEDIA_PATH) {
    return [process.env.INEXOR_MEDIA_PATH];
  }
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
  if (process.env.INEXOR_CONFIG_PATH) {
    return [process.env.INEXOR_CONFIG_PATH];
  }
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
  interfaces_path: interfaces_path,
  getMediaPaths: getMediaPaths,
  getConfigPaths: getConfigPaths,
  DEFAULT_PORT: DEFAULT_PORT
};

