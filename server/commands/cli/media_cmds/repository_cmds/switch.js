const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for switching the branch of a media repository
exports.command = 'switch <name> <branch>'
exports.describe = 'Switches the branch of a media repository'

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the media repository.'
  },
  branch: {
    type: 'string',
    describe: 'The name of the branch to switch to.'
  }
}

exports.handler = function(argv) {
  log.info('Switching to branch ' + argv.branch + ' of the media repository ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.media.repositories.branch(argv.name, argv.branch, function(data, response) {
    log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
  });
}
