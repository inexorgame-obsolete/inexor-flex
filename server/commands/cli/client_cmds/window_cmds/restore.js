const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for restoring the client window
exports.command = 'restore <instance>'
exports.describe = 'Restores the client window'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.client.window.restore(argv.instance);
}
