// Configuration for managing server instances of Inexor Core
exports.command = 'server <command>'
exports.describe = 'Manage servers'
exports.builder = function (yargs) {
  return yargs.commandDir('server_cmds')
}
exports.handler = function (argv) {}
