const bunyan = require('bunyan');

/**
 * @private
 * Returns a bunyan logger
 * @param {boolean} console - whether or not to use the console
 * @param {string} path - a file path
 * @param {string} level - the log level to display
 */
module.exports = (console, file, level) => {
  streams = [];
  if (console) {
   streams.push({
     stream: process.stdout
   })
  }

  if (file != null) {
   streams.push({
     path: file
   })
  }

  return bunyan.createLogger({name: '@inexor-game/flex', level: level, streams: streams});
}
