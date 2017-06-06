exports.command = 'tree <command>';
exports.describe = 'Inexor Tree manipulation';
exports.builder = function (yargs) {
  return yargs.commandDir('tree_cmds');
};
exports.handler = function (argv) {};
