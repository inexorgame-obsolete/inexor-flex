// Configuration for starting a server instance of Inexor Core
exports.command = 'start <instance> [port]'
exports.describe = 'Starts an server instance of Inexor Core'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  port: {
    default: null,
    type: 'number',
    describe: 'The port to use. If not given, the port is the same as the instance id.'
  }
}
