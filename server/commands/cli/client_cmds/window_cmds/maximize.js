const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for maximizing the client window
exports.command = 'maximize'
exports.describe = 'Maximizes the client window'

exports.builder = {
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  // TODO: implement tree client -> window -> maximize
  // client.flex.instances.getAll(argv.instance);
}
