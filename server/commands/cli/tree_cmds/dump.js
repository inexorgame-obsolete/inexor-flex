const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'dump <instance> [filename]'
exports.describe = 'Dumps the Inexor Tree for the given instance id'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  filename: {
    type: 'string',
    describe: 'The file to save'
  }
}

exports.handler = function(argv) {
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.tree.dump(argv.instance, function(data, response) {
    if (response.statusCode == 200) {
      if (!argv.filename) {
          // var treeAsString = data.toString('utf-8');
          // log.info(data);
          log.info(JSON.stringify(data, null, 2));
      }
    } else if (response.statusCode == 404) {
      log.info('404');
      // TODO: print
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
