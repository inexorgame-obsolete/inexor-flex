const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'info [versionRange] [channelSearch]';
exports.describe = 'Gets a release info by semantic version range and release channel';

exports.builder = {
  versionRange: {
    default: '*',
    type: 'string',
    describe: 'If given, the newest version fulfilling this semantic version range is downloaded.'
  },
  channelSearch: {
    default: '*',
    type: 'string',
    describe: 'If given and not "*" only versions in this particular channel are downloaded.'
  }
};

exports.handler = function(argv) {
  log.info('Listing releases via the command-line')
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.releases.info(argv.versionRange, argv.channelSearch, (data, response) => {
    if (response.statusCode == 200) {
      log.info(JSON.stringify(data));
    }
  });
}
