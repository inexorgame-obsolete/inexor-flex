const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

exports.command = 'list';
exports.describe = 'Lists all releases';

exports.handler = function(argv) {
    log.info('Listing releases via the command-line')
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.list((data, response) => {
        if (response.statusCode == 200) {
            log.info(JSON.stringify(data));
        }
    })
}
