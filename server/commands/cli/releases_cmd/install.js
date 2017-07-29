const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'install <version>';
exports.describe = 'Install a specific release';

exports.handler = function(argv) {
    log.info(`Installing release with version ${argv.version} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.install(argv.version, (data, response) => {
        // The log is already handled elsewhere
    })
}
