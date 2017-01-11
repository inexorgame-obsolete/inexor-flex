const TreeClient = require('@inexor-game/treeclient').TreeClient;

// Configuration for change the fullscreen state of the client window
exports.command = 'fullscreen <mode>'
exports.describe = 'Changes the fullscreen state of the client window'

exports.builder = {
  mode: {
    type: 'string',
    describe: 'The fullscreen state: window, fullscreen or windowed_fullscreen'
    // TODO: restrict to the possible values: window, fullscreen or windowed_fullscreen
  },
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  // TODO: implement tree client -> window -> fullscreen
  // client.flex.instances.getAll(argv.instance);
}
