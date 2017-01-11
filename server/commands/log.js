exports.commands = 'log [file] [console] [level]'
exports.describe = 'Configures the log system.'

exports.builder = {
  file: {
    default: null,
    describe: 'Specifies the path of the log file to be used.'
  },
  console: {
    default: true,
    describe: 'Whether or not to use the command line.'
  },
  level: {
    default: 'debug',
    describe: 'The log level to be used. See @bunyan.'
  }
}
