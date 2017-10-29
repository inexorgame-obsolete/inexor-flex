const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'install <version> [<channel>]';
exports.describe = 'Install a release (version can be a semantic version range. If channel is not empty, it only installs releases of that channel)';

exports.handler = function(argv) {
    log.info(`Installing release with version ${argv.version} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.install(argv.version, argv.channel, (data, response) => {
        // The log is already handled elsewhere
    })
}
