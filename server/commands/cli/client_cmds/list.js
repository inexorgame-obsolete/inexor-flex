const debuglog = require('util').debuglog('cmd-client-list');
const tree_client = require('@inexor-game/treeclient');

// Configuration for listing all client instances
exports.command = 'list'
exports.describe = 'Lists all client instances'

exports.builder = {
}

exports.handler = function(argv) {
  debuglog('Starting an Inexor Core client with instance id ' + argv.instance);
  var client = new tree_client.TreeClient('localhost', 31416);
  client.flex.instances.getAll(argv.instance, function(data, response) {
    debuglog(String(data));
    debuglog(String(response));
  });
}
