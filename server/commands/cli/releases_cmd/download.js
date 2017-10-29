const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'download <version> [<channel>]';
exports.describe = 'Download a release matching the semantic version range and which is in the channel (or in any if channel is empty)';

exports.handler = function(argv) {
    log.info(`Downloading release with version ${argv.version} @ ${argv.channel} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.download(argv.version, argv.channel, (data, response) => {
        // The log is already handled elsewhere
    })
}
