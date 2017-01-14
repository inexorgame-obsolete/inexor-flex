/**
 * @module path
 */

const os = require('os');
const process = require('process');
const path = require('path');

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
 * Is either an absolute path or a relative path to the flex directory
 * @property {string} config_path
 */
const config_path = (process.env.CONFIG_PATH) ? process.env.CONFIG_PATH : 'config';

/**
 * The media directory of inexor
 * Is either an absolute path or a relative path to the flex directory
 */
const media_path = (process.env.MEDIA_PATH) ? process.env.MEDIA_PATH: 'media';

module.exports = {
  flex_path: flex_path,
  binary_path: binary_path,
  pid_path: pid_path,
  config_path: config_path,
  media_path: media_path
};
