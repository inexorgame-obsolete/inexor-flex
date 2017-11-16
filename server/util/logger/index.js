/**
 * @module logger
 */
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');

// NOTE: This could be converted to be used as a global debug module

/**
 * @private
 * Returns a bunyan logger
 * @param {boolean} console - whether or not to use the console
 * @param {string} path - a file path
 * @param {string} level - the log level to display
 */
module.exports = (name = '@inexorgame/flex', console = true, file = null, level = 'info') => {
  let streams = [];

  if (console) {
    streams.push({
      type: 'raw',
      stream: bunyanDebugStream({ forceColor: true })
    });
  }

  if (file != null) {
    streams.push({
      path: file
    });
  }

  return bunyan.createLogger({
    name: name,
    level: level,
    streams: streams,
    serializers: bunyanDebugStream.serializers
  });

}
