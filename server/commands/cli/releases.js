// Configuration for managing releases of Inexor Core
exports.command = 'release <command>'
exports.describe = 'Manage releases'
exports.builder = function (yargs) {
    return yargs.commandDir('releases')
}
exports.handler = function (argv) {}
