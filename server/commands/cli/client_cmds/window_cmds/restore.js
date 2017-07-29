const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

// Configuration for restoring the client window
exports.command = 'restore <instance>'
exports.describe = 'Restores the client window'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}

exports.handler = function(argv) {
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.client.window.restore(argv.instance);
  log.info('Restored window of client ' + argv.instance);
}
