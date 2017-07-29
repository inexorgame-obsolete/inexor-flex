const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'shutdown';
exports.describe = 'Stops all running instances and shutdown';
exports.builder = {};
exports.handler = function(argv) {
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.stopAll(function(data, response) {
    client.flex.shutdown();
  })
};
