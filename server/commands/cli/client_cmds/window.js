// Configuration for managing server instances of Inexor Core
exports.command = 'window <command>'
exports.describe = 'Manage the window of a client'
exports.builder = function (yargs) {
  return yargs.commandDir('window_cmds');
}
exports.handler = function (argv) {}
