// Configuration for starting a client instance of Inexor Core
exports.command = 'start <instance>'
exports.describe = 'Starts an client instance of Inexor Core'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  }
}
