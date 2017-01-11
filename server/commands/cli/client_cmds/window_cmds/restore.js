const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for restoring the client window
exports.command = 'restore'
exports.describe = 'Restores the client window'

exports.builder = {
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  // TODO: implement tree client -> window -> restore
  // client.flex.instances.getAll(argv.instance);
}
