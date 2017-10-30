const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'install [version] [channel]';
exports.describe = 'Install a release.';

exports.builder = {
    version: {
        default: '*',
        type: 'string',
        describe: 'If given, the newest version fulfilling this semantic version range is installed.'
    },
    channel: {
        default: '*',
        type: 'string',
        describe: 'If given and not "*" only versions in this particular channel get installed.'
    }
};

exports.handler = function(argv) {
    log.info(`Installing release with version ${argv.version} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.install(argv.version, argv.channel, (data, response) => {
        // The log is already handled elsewhere
    })
}
