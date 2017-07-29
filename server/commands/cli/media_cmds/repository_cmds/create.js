const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for creating a media repository
exports.command = 'create <name> [url]'
exports.describe = 'Creates a media repository'

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the media repository.'
  },
  url: {
    type: 'string',
    describe: 'The url to a GIT repository.'
  }
}

exports.handler = function(argv) {
  log.info('Creating the media repository ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.media.repositories.create(argv.name, argv.url, function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
