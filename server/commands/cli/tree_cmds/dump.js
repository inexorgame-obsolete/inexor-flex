const prettyjson = require('prettyjson');
const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

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
  var client = new TreeClient('localhost', 31416);
  client.flex.tree.dump(argv.instance, function(data, response) {
    if (response.statusCode == 200) {
      if (argv.filename) {
      } else {
        // var treeAsString = data.toString('utf-8');
        // log.info(data);
        log.info(prettyjson.render(data));
      }
    } else if (response.statusCode == 404) {
      log.info('404');
      // TODO: print
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
