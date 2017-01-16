const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for scanning for media repositories
exports.command = 'scan'
exports.describe = 'Scans for media repositories'

exports.builder = {
}

exports.handler = function(argv) {
  log.info('Scanning for media repositories');
  var client = new TreeClient('localhost', 31416);
  client.flex.media.repositories.scan(function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
