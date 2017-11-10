const TreeClient = require('@inexorgame/treeclient').TreeClient;

exports.command = 'sysinfo';
exports.describe = 'Displays the flex sysinfo';
exports.builder = {};
exports.handler = function(argv) {
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.flex.sysinfo();
};
