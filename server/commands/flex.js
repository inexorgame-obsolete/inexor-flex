// Configuration for the webserver
exports.command = 'flex <port> [host] [webdir]'
exports.describe = 'Configures the Inexor Flex server'

exports.builder = {
  port: {
    type: 'number',
    describe: 'The server port to use.'
  },
  host: {
    default: 'localhost',
    type: 'string',
    describe: 'The host to listen on.'
  },
  webdir: {
    default: 'inexor-ui/', // will be essential in further versions
    type: 'string',
    describe: 'Where to load the UI from'
  }
}
