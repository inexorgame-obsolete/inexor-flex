const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for updating a media repository
exports.command = 'update <name>'
exports.describe = 'Updates a media repository'

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the media repository.'
  }
}

exports.handler = function(argv) {
  log.info('Updating the media repository ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.media.repositories.update(argv.name, function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
