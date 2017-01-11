const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for listing all client instances
exports.command = 'minimize <instance>'
exports.describe = 'Minimizes the client window'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.client.window.minimize(argv.instance);
}
