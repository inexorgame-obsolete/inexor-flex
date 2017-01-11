const debuglog = require('util').debuglog('cmd-client-start');
const tree_client = require('@inexor-game/treeclient');

// Configuration for starting a client instance of Inexor Core
exports.command = 'start <instance>'
exports.describe = 'Starts an client instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Starting an client with id ' + argv.instance);
  var client = new tree_client.TreeClient('localhost', 31416);
  client.flex.instances.start(argv.instance);
}
