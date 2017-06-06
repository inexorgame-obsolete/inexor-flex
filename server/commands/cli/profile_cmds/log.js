exports.command = 'log <command>';
exports.describe = 'Configure logging of a profile';
exports.builder = function (yargs) {
  return yargs.commandDir('log_cmds')
};
exports.handler = function (argv) {};
