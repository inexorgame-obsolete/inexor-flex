const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for connecting to a client instance of Inexor Core
exports.command = 'connect <instance>'
exports.describe = 'Connects to a client'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  log.info('Connecting to the client with id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.connect(argv.instance, function(data, response) {
    if (response.statusCode == 200) {
      log.info('Connection to client with instance id ' + argv.instance + ' established');
    } else if (response.statusCode == 404) {
      log.info('Client with instance id ' + argv.instance + ' does not exist');
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
