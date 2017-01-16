// Configuration for managing server instances of Inexor Core
exports.command = 'media <command>'
exports.describe = 'Manage media'
exports.builder = function (yargs) {
  return yargs.commandDir('media_cmds')
}
exports.handler = function (argv) {}
