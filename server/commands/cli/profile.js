exports.command = 'profile <command>';
exports.describe = 'Switch, create or remove profiles';
exports.builder = function (yargs) {
  return yargs.commandDir('profile_cmds');
};
exports.handler = function (argv) {};
