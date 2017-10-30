const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'download [version] [channel]';
exports.describe = 'Download a release.';

exports.builder = {
    version: {
        default: '*',
        type: 'string',
        describe: 'If given, the newest version fulfilling this semantic version range is downloaded.'
    },
    channel: {
        default: '*',
        type: 'string',
        describe: 'If given and not "*" only versions in this particular channel are downloaded.'
    }
};

exports.handler = function(argv) {
    log.info(`Downloading release with version ${argv.version} @ ${argv.channel} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.download(argv.version, argv.channel, (data, response) => {
        // The log is already handled elsewhere
    })
}
