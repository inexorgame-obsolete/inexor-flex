const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'set <instance> <path> <value>'
exports.describe = 'Sets the value of an Inexor Tree node'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  path: {
    type: 'string',
    describe: 'The path to the node without instance id.'
  },
  value: {
    type: 'string',
    describe: 'The value to set'
  }
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  client.flex.tree.set(argv.instance, argv.path, argv.value, function(data, response) {
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
