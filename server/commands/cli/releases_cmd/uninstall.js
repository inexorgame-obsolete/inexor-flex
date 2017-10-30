const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'uninstall <version> [channel]';
exports.describe = 'Uninstall a specific release';

exports.builder = {
    version: {
        type: 'string',
        describe: 'The semantic version range. If given, the newest version gets deinstalled.'
    },
    channel: {
        default: '*',
        type: 'string',
        describe: 'If given and not "*" only versions in this particular channel get deinstalled.'
    }
};

exports.handler = function(argv) {
    log.info(`Uninstalling release with version ${argv.version} @ ${argv.channel} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.install(argv.version, argv.channel, (data, response) => {
        // The log is already handled elsewhere
    })
}
