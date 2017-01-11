const debuglog = require('util').debuglog('cmd-server-create');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for starting a server instance of Inexor Core
exports.command = 'create <instance> [port]'
exports.describe = 'Creates an server instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  port: {
    default: null,
    type: 'number',
    describe: 'The port to use. If not given, the port is the same as the instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Starting an Inexor Core server with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.create(argv.instance);
}
