const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for scanning for media repositories
exports.command = 'scan'
exports.describe = 'Scans for media repositories'

exports.builder = {
}

exports.handler = function(argv) {
  log.info('Scanning for media repositories');
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.media.repositories.scan(function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
