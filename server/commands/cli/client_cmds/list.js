const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for listing all client instances
exports.command = 'list'
exports.describe = 'Lists all clients'

exports.builder = {
}

exports.handler = function(argv) {
  log.info('List of clients:');
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.getAll(function(data, response) {
    // TODO: filter clients
    log.info(String(data));
    log.info(String(response));
  });
}
