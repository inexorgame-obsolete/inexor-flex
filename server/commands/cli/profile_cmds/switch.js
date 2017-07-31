const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'switch <name>';
exports.describe = 'Switch the profile of Inexor Flex';

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the profile.'
  }
};

exports.handler = function(argv) {
  log.info('Switching to profile ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.profiles.switch(argv.name, function(data, response) {
    log.info('Switched to profile ' + argv.name);
  });
};
