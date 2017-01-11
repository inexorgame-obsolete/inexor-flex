const debuglog = require('util').debuglog('cmd-client-create');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for starting a client instance of Inexor Core
exports.command = 'create <instance> [port]'
exports.describe = 'Creates an client instance'

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
  debuglog('Starting an Inexor Core client with instance id ' + argv.instance);
  console.log('create cmd');
  var client = new TreeClient('localhost', 31416);
  console.log(client);
  client.flex.instances.create(argv.instance);
}
