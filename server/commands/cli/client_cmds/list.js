const debuglog = require('util').debuglog('cmd-client-list');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for listing all client instances
exports.command = 'list'
exports.describe = 'Lists all client instances'

exports.builder = {
}

exports.handler = function(argv) {
  debuglog('Starting an Inexor Core client with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.getAll(function(data, response) {
    debuglog(String(data));
    debuglog(String(response));
  });
}
