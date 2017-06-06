const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'create <name> [hostname] [port]';
exports.describe = 'Creates a new profile';

exports.builder = {
  name: {
    type: 'string',
    describe: 'The name of the profile.'
  },
  hostname: {
    default: 'localhost',
    type: 'string',
    describe: 'The hostname to use.'
  },
  port: {
    default: 31416,
    type: 'number',
    describe: 'The port to use.',
  }
};

exports.handler = function(argv) {
  log.info('Creating a new profile ' + argv.name);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.profiles.create(argv.name, argv.hostname, argv.port, function(data, response) {
    client.flex.shutdown();
  })
};
