const debuglog = require('util').debuglog('cmd-server-stop');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for starting a server instance of Inexor Core
exports.command = 'stop <instance>'
exports.describe = 'Stops an server instance'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  debuglog('Stopping the server with id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.stop(argv.instance);
}
