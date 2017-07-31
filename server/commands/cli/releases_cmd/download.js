const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'download <version>';
exports.describe = 'Download a specific release';

exports.handler = function(argv) {
    log.info(`Downloading release with version ${argv.version} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.download(argv.version, (data, response) => {
        // The log is already handled elsewhere
    })
}
