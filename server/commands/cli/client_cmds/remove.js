const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for removing a client instance of Inexor Core
exports.command = 'remove <instance>'
exports.describe = 'Removes a client'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  log.info('Removing the client with instance id ' + argv.instance);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.remove(argv.instance, function(data, response) {
    log.info('Client with instance id ' + argv.instance + ' removed.');
  });
}
