// Configuration for managing server instances of Inexor Core
exports.command = 'client <command>'
exports.describe = 'Manage clients'
exports.builder = function (yargs) {
  return yargs.commandDir('client_cmds')
}
exports.handler = function (argv) {}
