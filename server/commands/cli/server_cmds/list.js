const debuglog = require('util').debuglog('cmd-server-list');
const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for listing all server instances
exports.command = 'list'
exports.describe = 'Lists all server instances'

exports.builder = {
}

exports.handler = function(argv) {
  debuglog('Starting an Inexor Core server with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.getAll(argv.instance, function(data, response) {
    debuglog(String(data));
    debuglog(String(response));
  });
}
