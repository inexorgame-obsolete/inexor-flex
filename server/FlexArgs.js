const util = require('util');

const inexor_logger = require('@inexorgame/logger');

/**
 * Handles the command line arguments for the Flex server.
 */
class FlexArgs {

  constructor() {
    this.argv = require('yargs')
      .option('profile', {
        default: null,
        type: 'string',
        describe: 'Sets the profile to use.'
      })
      .option('hostname', {
        default: null,
        type: 'string',
        describe: 'The hostname to listen on. Overwrites the profile value.'
      })
      .option('port', {
        default: null,
        type: 'number',
        describe: 'The server port to use. Overwrites the profile value.'
      })
      .option('console', {
        default: true,
        type: 'boolean',
        describe: 'If true, the Inexor Flex webserver logs to console'
      })
      .option('file', {
        default: null,
        type: 'string',
        describe: 'Sets the log file of the Inexor Flex webserver.'
      })
      .option('level', {
        default: 'info',
        type: 'string',
        describe: 'Sets the log level of the Inexor Flex webserver.'
      })
      .option('ignorepid', {
        default: false,
        type: 'boolean',
        describe: 'Ignores the PID file.'
      })
      .help()
      .epilogue('https://inexor.org/')
      .argv;
    inexor_logger('flex.server', this.argv.console, this.argv.file, this.argv.level).debug(util.format('Using command line options:\n%s', JSON.stringify(this.argv, undefined, 2)));
  }

}

module.exports = FlexArgs;
