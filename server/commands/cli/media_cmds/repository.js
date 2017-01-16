// Configuration for managing media repositories
exports.command = 'repository <command>'
exports.describe = 'Manage the media repositories'
exports.builder = function (yargs) {
  return yargs.commandDir('repository_cmds');
}
exports.handler = function (argv) {}
