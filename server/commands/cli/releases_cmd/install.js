const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'install [versionRange] [channelSearch]';
exports.describe = 'Install a release.';

exports.builder = {
  versionRange: {
    default: '*',
    type: 'string',
    describe: 'If given, the newest version fulfilling this semantic version range is installed.'
  },
  channelSearch: {
    default: '*',
    type: 'string',
    describe: 'If given and not "*" only versions in this particular channel get installed.'
  }
};

exports.handler = function(argv) {
  log.info(`Installing release with version ${argv.versionRange} @ ${argv.channelSearch} via the command-line`);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.releases.install(argv.versionRange, argv.channelSearch, (data, response) => {
    // The log is already handled elsewhere
  });
};
