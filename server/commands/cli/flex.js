exports.command = 'flex <command>'
exports.describe = 'Manage Inexor Flex'
exports.builder = function (yargs) {
  return yargs.commandDir('flex_cmds')
}
exports.handler = function (argv) {}
