const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for stopping a client instance of Inexor Core
exports.command = 'stop <instance>'
exports.describe = 'Stops a client'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  log.info('Stopping the client with id ' + argv.instance);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.stop(argv.instance, function(data, response) {
    if (response.statusCode == 200) {
      log.info('Client with instance id ' + argv.instance + ' stopped');
    } else if (response.statusCode == 404) {
      log.info('Client with instance id ' + argv.instance + ' does not exist');
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
