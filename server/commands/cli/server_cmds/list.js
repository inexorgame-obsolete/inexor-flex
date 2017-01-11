const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for listing all server instances
exports.command = 'list'
exports.describe = 'Lists all servers'

exports.builder = {
}

exports.handler = function(argv) {
  log.info('List of servers:');
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.getAll(function(data, response) {
    // TODO: filter servers
    log.info(JSON.stringify(data));
    log.info(String(response));
  });
}
