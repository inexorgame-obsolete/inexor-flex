const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'get <instance> <path>'
exports.describe = 'Get the value of an Inexor Tree node'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  path: {
    type: 'string',
    describe: 'The path to the node without instance id.'
  }
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  client.flex.tree.get(argv.instance, argv.path, function(data, response) {
    if (response.statusCode == 200) {
      log.info('200');
      // TODO: print
    } else if (response.statusCode == 404) {
      log.info('404');
      // TODO: print
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
