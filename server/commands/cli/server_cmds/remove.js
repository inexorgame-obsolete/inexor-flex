const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for starting a server instance of Inexor Core
exports.command = 'remove <instance>'
exports.describe = 'Removes a server'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  log.info('Removing the server with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.remove(argv.instance, function(data, response) {
    log.info('Server with instance id ' + argv.instance + ' removed');
  });
}
