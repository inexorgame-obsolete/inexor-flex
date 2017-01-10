const debuglog = require('util').debuglog('cmd-server-list');
const tree_client = require('@inexor-game/treeclient');

// Configuration for listing all server instances
exports.command = 'list'
exports.describe = 'Lists all server instances'

exports.builder = {
}

exports.handler = function(argv) {
  debuglog('Starting an Inexor Core server with instance id ' + argv.instance);
  var client = new tree_client.TreeClient('localhost', 31416);
  client.flex.instances.getAll(argv.instance, function(data, response) {
    debuglog(String(data));
    debuglog(String(response));
  });
}
