const debuglog = require('util').debuglog('cmd-shutdown');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for listing all client instances
exports.command = 'shutdown'
exports.describe = 'Stops all running instances and shutdown'

exports.builder = {
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.stopAll(function() {
    client.flex.shutdown();
  })
}
