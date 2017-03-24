const child_process = require('child_process');

const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'restart'
exports.describe = 'Restarts Inexor Flex'

exports.builder = {
}

exports.handler = function(argv) {
  var client = new TreeClient('localhost', 31416);
  log.info('Stopping all instances...');
  client.flex.instances.stopAll(function(data, response) {
    log.info('Shutting down Inexor Flex...');
    client.flex.shutdown(function(data, response) {
      log.info('Starting Inexor Flex...');
      // Starting Inexor Flex detached without stdio
      const child = child_process.spawn(process.argv[0], [
        'server/index.js',
        'log',
        '--port',
        '31416',
        '--webdir',
        'assets/'
      ], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    });
  })
}
