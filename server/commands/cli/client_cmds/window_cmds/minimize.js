const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for listing all client instances
exports.command = 'minimize'
exports.describe = 'Minimizes the client window'

exports.builder = {
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  // TODO: implement tree client -> window -> minimize
  // client.flex.instances.getAll(argv.instance);
}
