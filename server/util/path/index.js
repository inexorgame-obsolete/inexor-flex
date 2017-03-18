/**
 * @module path
 * // TODO: Might be better called inexor-game/defaults
 */

const os = require('os');
const process = require('process');
const path = require('path');
const xdgBasedir = require('xdg-basedir');

/**
 * The path of the flex folder
 * @property {string} flex_path
 */

const flex_path = process.env.PWD;

/**
 * The executable path of Inexor Core
 * The path can be overriden using the BINARY envirpnment flag
 * @property {string} binary_path
 */

if (process.env.BINARY) {
  const binary_path = process.env.BINARY;
} else {
  let path = null;
  let platform = os.platform();

  switch(platform) {
    // TODO: Add more platforms
    // TODO: Add more binary types (inexor_client, inexor_server, inexor_bot, ...)
    case 'linux': binary_path = 'bin/inexor'; break;
    case 'win32': binary_path = 'bin/inexor.exe'; break; // TODO: @a_teammate, add windows path
    case 'darwin': binary_path = 'bin/inexor'; break; // TODO: @Fohlen, add OSX path
    default:
      throw new Error('${platform} is not currently supported')
  }
}

/**
 * The pid file that Inexor Flex uses
 * NOTE: Might be prefixed with /inexor in the future
 */
const pid_path =  (process.env.PID_PATH) ? path.resolve(process.env.PID_PATH) : path.resolve(os.tmpdir() + '/flex.pid');

/**
 * The config folder of flex
 * By default the XDG config path is used. This can be overwritten by the
 * environment variable CONFIG_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 * @property {string} config_path
 */
const config_path = (process.env.CONFIG_PATH) ? process.env.CONFIG_PATH : (xdgBasedir.config ? path.join(xdgBasedir.config, 'inexor') : 'config');

/**
 * The media directory of inexor
 * By default the XDG data path is used. This can be overwritten by the
 * environment variable MEDIA_PATH (absolute path). If both are not set
 * the fallback is a relative path to the flex directory.
 */
const media_path = (process.env.MEDIA_PATH) ? process.env.MEDIA_PATH: (xdgBasedir.data ? path.join(xdgBasedir.data, 'inexor/media') : 'media');

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
 * Returns a preference-ordered array of base directories to search for media
 * files in addition to the default media path.
 * @return {string}
 */
function getMediaPaths() {
  var media_paths = [];
  for (var i = 0; i < xdgBasedir.dataDirs.length; i++) {
    media_paths.push(path.join(xdgBasedir.dataDirs[i], 'inexor/media'));
  }
  return media_paths;
}

/**
 * Returns a preference-ordered array of base directories to search for
 * configuration files in addition to the default config path.
 * @return {string}
 */
function getConfigPaths() {
  var config_paths = [];
  for (var i = 0; i < xdgBasedir.configDirs.length; i++) {
    config_paths.push(path.join(xdgBasedir.configDirs[i], 'inexor'));
  }
  return config_paths;
}

/**
 * The default port of Inexor Flex to use
 * @property {number} DEFAULT_PORT
 */
const DEFAULT_PORT = 31416;

module.exports = {
  flex_path: flex_path,
  binary_path: binary_path,
  pid_path: pid_path,
  config_path: config_path,
  media_path: media_path,
  getBasePath: getBasePath,
  getBinaryPath: getBinaryPath,
  getMediaPaths: getMediaPaths,
  getConfigPaths: getConfigPaths,
  DEFAULT_PORT: DEFAULT_PORT
};
