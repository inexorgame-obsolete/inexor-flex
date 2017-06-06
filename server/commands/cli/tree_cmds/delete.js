const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'delete <instance> <path>'
exports.describe = 'Deletes the node'

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
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.tree.delete(argv.instance, argv.path, function(data, response) {
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
