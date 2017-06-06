// TODO: remove ?

// Configuration for the Inexor Flex logging
exports.commands = 'log';
exports.describe = 'Configures the logging of Inexor Flex.';

exports.builder = {
  file: {
    default: null,
    type: 'string',
    describe: 'Specifies the path of the log file to be used.'
  },
  console: {
    default: true,
    type: 'boolean',
    describe: 'Whether or not to use the command line.'
  },
  level: {
    default: 'info',
    type: 'string',
    describe: 'The log level to be used. See @bunyan.'
  }
}
