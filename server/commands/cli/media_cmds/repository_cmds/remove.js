const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for removing a media repository
exports.command = 'remove <name>'
exports.describe = 'Removes a media repository'

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the media repository.'
  }
}

exports.handler = function(argv) {
  log.info('Removing the media repository ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.media.repositories.remove(argv.name, function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
