const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'fetch';
exports.describe = 'Fetches latest releases';

exports.handler = function(argv) {
    log.info('Fetching latest releases via the command-line');
    let client = new TreeClient(argv.profileHostname, argv.profilePort);
    client.releases.fetch((data, response) => {
        if (response.statusCode == 200) {
            log.info('Releases successfully fetched');
        }
    })
}