exports.command = 'media <command>';
exports.describe = 'Management of media and media repositories';
exports.builder = function (yargs) {
  return yargs.commandDir('media_cmds');
};
exports.handler = function (argv) {};
