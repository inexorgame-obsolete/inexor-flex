const TreeClient = require('@inexorgame/treeclient').TreeClient;

exports.command = 'version';
exports.describe = 'Displays the flex version';
exports.builder = {};
exports.handler = function(argv) {
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.flex.version();
};
