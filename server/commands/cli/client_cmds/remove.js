const debuglog = require('util').debuglog('cmd-client-remove');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for starting a client instance of Inexor Core
exports.command = 'remove <instance>'
exports.describe = 'Removes an client instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Removes the client with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.remove(argv.instance);
}
