// Configuration for the Inexor Flex webserver
exports.command = 'flex <port> [host] [webdir] [binary]'
exports.describe = 'Configures the Inexor Flex server'

exports.builder = {
  port: {
    type: 'number',
    describe: 'The server port to use.'
  },
  host: {
    default: 'localhost',
    type: 'string',
    describe: 'The hostname to listen on.'
  },
  webdir: {
    default: 'inexor-ui/', // will be essential in further versions
    type: 'string',
    describe: 'The path to the Inexor user interface.'
  },
  binary: {
    default: null,
    type: 'string',
    describe: 'The path to the Inexor Core binary.'
  }
}
