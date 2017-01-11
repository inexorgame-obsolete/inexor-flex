const debuglog = require('util').debuglog('cmd-client-stop');
const tree_client = require('@inexor-game/treeclient');

// Configuration for starting a client instance of Inexor Core
exports.command = 'stop <instance>'
exports.describe = 'Stops an client instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Stopping the client with id ' + argv.instance);
  var client = new tree_client.TreeClient('localhost', 31416);
  client.flex.instances.stop(argv.instance);
}
