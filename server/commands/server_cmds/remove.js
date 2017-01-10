const debuglog = require('util').debuglog('cmd-server-remove');
const tree_client = require('@inexor-game/treeclient');

// Configuration for starting a server instance of Inexor Core
exports.command = 'remove <instance>'
exports.describe = 'Removes an server instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Removes the server with instance id ' + argv.instance);
  var client = new tree_client.TreeClient('localhost', 31416);
  client.flex.instances.remove(argv.instance);
}
