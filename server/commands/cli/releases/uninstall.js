const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'uninstall <version>';
exports.describe = 'Uninstall a specific release';

exports.handler = function(argv) {
    log.info(`Uninstalling release with version ${argv.version} via the command-line`);
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.install(argv.version, (data, response) => {
        // The log is already handled elsewhere
    })
}
