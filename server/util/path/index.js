/**
 * @module path
 */

const os = require('os');
const process = require('process');

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

module.exports = {
  flex_path: flex_path,
  binary_path: binary_path
};
