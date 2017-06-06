const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for maximizing the client window
exports.command = 'maximize <instance>'
exports.describe = 'Maximizes the client window'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.client.window.maximize(argv.instance);
  log.info('Maximized window of client ' + argv.instance);
}
