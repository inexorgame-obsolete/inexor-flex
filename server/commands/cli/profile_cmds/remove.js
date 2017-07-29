const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'remove <profile>';
exports.describe = 'Removes a profile';

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the profile.'
  }
};

exports.handler = function(argv) {
  log.info('Removing profile ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.profiles.remove(argv.name, function(data, response) {
    log.info('Profile ' + argv.name + ' removed.');
  });
};
