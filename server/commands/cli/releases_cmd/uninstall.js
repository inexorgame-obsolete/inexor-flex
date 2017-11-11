const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'uninstall <versionRange> [channelSearch]';
exports.describe = 'Uninstall a specific release';

exports.builder = {
  versionRange: {
    type: 'string',
    describe: 'The semantic version range. If given, the newest version gets deinstalled.'
  },
  channelSearch: {
    default: '*',
    type: 'string',
    describe: 'If given and not "*" only versions in this particular channel get deinstalled.'
  }
};

exports.handler = function(argv) {
  log.info(`Uninstalling release with version ${argv.versionRange} @ ${argv.channelSearch} via the command-line`);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.releases.install(argv.versionRange, argv.channelSearch, (data, response) => {
    // The log is already handled elsewhere
  });
};
