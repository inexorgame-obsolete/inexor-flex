const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for starting a server instance of Inexor Core
exports.command = 'create <instance> [port]'
exports.describe = 'Creates a server'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  port: {
    default: null,
    type: 'number',
    describe: 'The port to use. If not given, the port is the same as the instance id.'
  }
}

exports.handler = function(argv) {
  log.info('Creating a server with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.create(argv.instance, function(data, response) {
    if (response.statusCode == 201) {
      log.info('Server with instance id ' + argv.instance + ' created');
    } else if (response.statusCode == 409) {
      log.info('Server with instance id ' + argv.instance + ' already exists');
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
