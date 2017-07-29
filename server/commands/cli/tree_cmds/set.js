const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'set <instance> <path> <value> [nosync]'
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
  },
  nosync: {
    type: 'boolean',
    describe: 'If set, no synchronization is done',
    default: false
  }
}

exports.handler = function(argv) {
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.tree.set(argv.instance, argv.path, argv.value, argv.nosync, function(data, response) {
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
