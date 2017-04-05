// Configuration for the Inexor Flex webserver
exports.command = 'flex';
exports.describe = 'Configures the webserver of Inexor Flex';

exports.builder = {
  port: {
    default: 31416,
    type: 'number',
    describe: 'The server port to use.'
  },
  host: {
    default: 'localhost',
    type: 'string',
    describe: 'The hostname to listen on.'
  },
  // TODO: make this able to handle multiple user interfaces
  webdir: {
    default: 'interfaces/', // will be essential in further versions
    type: 'string',
    describe: 'The path to the Inexor user interfaces.'
  },
  console: {
    default: true,
    type: 'boolean',
    describe: 'If true, the Inexor Flex webserver logs to console'
  },
  file: {
    default: null,
    type: 'string',
    describe: 'Sets the log file of the Inexor Flex webserver.'
  },
  level: {
    default: 'info',
    type: 'string',
    describe: 'Sets the log level of the Inexor Flex webserver.'
  }
}
