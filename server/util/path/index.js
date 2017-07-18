/**
 * @module path
 * // TODO: Might be better called inexor-game/defaults
 */

const os = require('os');
const process = require('process');
const path = require('path');
const standardPaths = require('./standardpaths');
const util = require('util');
const debuglog = util.debuglog('inexor-path');

/**
 * The path of the flex folder
 * @property {string} flex_path
 */

let flex_path = process.env.PWD;
if (process.platform == 'win32') {
  flex_path = process.cwd()
}

/**
 * @function determinePlatform
 * Determines the current platform, which can be one of the current supported ones (below):
 * - win64
 * - Linux64
 * @return {string}
 * TODO: Deprecate this when we find a fixed release naming schema for all platforms
 */
function determinePlatform() {
    platform = ''
    // TODO: Add more platforms

    if (os.platform() == 'win32') {
        platform += 'win'
    } else if (os.platform() == 'linux') {
        platform += 'Linux'
    }

    if (['arm64', 'x64'].includes(os.arch())) {
      if (platform == 'win')
        platform += '64' // TODO: We only do this for Windows currently, that sucks
    }

    return platform
}

if (process.env.BINARY) {
  const binary_path = process.env.BINARY;
} else {

}

/**
 * The executable path of Inexor Core
 * The path can be overriden using the BINARY envirpnment flag
 * @property {string} binary_path
 */

if (process.env.BINARY) {
  const binary_path = process.env.BINARY;
} else {
  let path = null;
  let platform = determinePlatform();

  switch(platform) {
    // TODO: This will be deprecated in the future by more flexible paths
    case 'Linux64': binary_path = 'bin/inexor'; break;
    case 'win64': binary_path = 'bin/inexor.exe'; break;
    default:
      binary_path = 'bin/inexor'; // fall back to unix path
      debuglog(`Using an unsupported platform ${platform}`);
  }
}

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
 */
const media_path = (process.env.MEDIA_PATH) ? process.env.MEDIA_PATH : path.join(standardPaths.appDataLocation[0], 'media');

/**
 * Returns the base directory of an Inexor installation (which is the parent
 * directory of Inexor Flex path).
 * @return {string}
 */
function getBasePath() {
  return path.resolve(path.join(flex_path, '..'));
}

/**
 * Returns the binary directory of an Inexor installation.
 * @return {string}
 */
function getBinaryPath() {
  return path.resolve(path.join(getBasePath(), 'bin'));
}

/**
 * Returns the path of the executable.
 *
 * TODO: use naming scheme for executables: inexor-[instance_type]-[platform][.extension]
 *       examples:
 *       - inexor-client-win32.exe
 *       - inexor-server-linux
 *
 * @return {string}
 */
function getExecutablePath(instance_type) {
  let platform = os.platform();
  let binary_path = getBinaryPath();
  switch (platform) {
    case 'linux':
      switch (instance_type) {
        case 'server':
          return path.join(getBinaryPath(), 'server');
        case 'client':
          return path.join(getBinaryPath(), 'inexor');
        default:
          throw new Error('${instance_type} is not currently supported')
      }
    case 'win32':
      switch (instance_type) {
        case 'server':
          return path.join(getBinaryPath(), 'server.exe');
        case 'client':
          return path.join(getBinaryPath(), 'inexor.exe');
        default:
          throw new Error('${instance_type} is not currently supported')
      }
    case 'darwin':
      switch (instance_type) {
        case 'server':
          return path.join(getBinaryPath(), 'server');
        case 'client':
          return path.join(getBinaryPath(), 'inexor');
        default:
          throw new Error('${instance_type} is not currently supported')
      }
    default:
      throw new Error('${platform} is not currently supported')
  }
  return path.resolve(path.join(getBasePath(), 'bin'));
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
  binary_path: binary_path,
  pid_path: pid_path,
  config_path: config_path,
  media_path: media_path,
  getBasePath: getBasePath,
  getBinaryPath: getBinaryPath,
  getExecutablePath: getExecutablePath,
  getMediaPaths: getMediaPaths,
  getConfigPaths: getConfigPaths,
  determinePlatform: determinePlatform,
  DEFAULT_PORT: DEFAULT_PORT
};

