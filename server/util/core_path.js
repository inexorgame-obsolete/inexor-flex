const os = require('os');
/**
 * The executable path of Inexor Core
 * @property {string} GOBAL.binary_path
 */
let path = null;

let platform = os.platform();

switch(platform) {
  // TODO: Add more platforms
  case 'linux': path = '/'; break;
  case 'win32': path = '?'; break; // TODO: @a_teammate, add windows path
  default:
    throw new Error('${platform} is not currently supported')
}

module.exports = path;
