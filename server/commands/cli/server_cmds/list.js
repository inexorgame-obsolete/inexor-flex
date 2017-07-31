const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for listing all server instances
exports.command = 'list'
exports.describe = 'Lists all servers'

exports.builder = {
}

exports.handler = function(argv) {
  log.info('List of servers:');
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.getAll(function(data, response) {
    // TODO: filter servers
    log.info(JSON.stringify(data));
    log.info(String(response));
  });
}
