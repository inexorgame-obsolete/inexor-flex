/**
 * @module console
 */

const bunyan = require('bunyan');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

const debuglog = util.debuglog('instances');
const log = require('@inexor-game/logger')();

/**
 * The console manager stores a ring buffer for each instance.
 */
class ConsoleManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(application_context) {
    super();

    var root = application_context.get('tree');

    /** @private */
    this.instancesNode = root.getOrCreateNode('instances');
  }

  /**
   * Creates a new console for the given Inexor Core instance.
   * @function
   * @param {tree.Node} [instanceNode] The instance tree node.
   * @param {process} [instanceProcess] The instance process.
   * @return {Promise<tree.Node>} The console tree node.
   */
  createConsole(instanceNode, instanceProcess, maxRecords = 100) {
    return new Promise((resolve, reject) => {
      let instanceId = instanceNode.getName();
      let instanceType = instanceNode.type;
      
      // Create ring buffer for the instance console
      let instanceConsoleBuffer = new bunyan.RingBuffer({ limit: maxRecords });
      
      // Create streams for stdout and ring buffer
      let stdoutStream = {
        level: 'info',
        stream: process.stdout
      };
      // use 'raw' to get raw log record objects
      let bufferStream = {
        level: 'trace',
        type: 'raw',
        stream: instanceConsoleBuffer
      };
      
      // Create the instance logger
      let loggerName = util.format('@inexor-game/core/%s/%s', instanceType, instanceId);
      let instanceLogger = bunyan.createLogger({
        name: loggerName,
        streams: [
          stdoutStream,
          bufferStream
        ]
      });

      // Redirect the instance stdout and stderr to the instance logger
      instanceProcess.stdout.on('data', (data) => { this.mapStreamToLog(instanceLogger, data) });
      instanceProcess.stderr.on('data', (data) => { this.mapStreamToLog(instanceLogger, data) });

      // Create a tree node containing the instance logger and the ring buffer
      let consoleNode = instanceNode.getOrCreateNode('console');
      consoleNode.addChild('logger', 'object', instanceLogger, false);
      consoleNode.addChild('buffer', 'object', instanceConsoleBuffer, false);

      resolve(consoleNode);
    });
  }

  /**
   * Returns the logger for the given instance.
   */
  getInstanceLogger(instanceId) {
    return this.instancesNode.getChild(instanceId).console.logger.get();
  }

  /**
   * Redirects stdout / stderr streams to logging.
   * @function
   * @param {stream} data - The stream data.
   * @return {Promise<bool>}
   */
  mapStreamToLog(instanceLogger, data) {
    // TODO: write a custom sink for spdlog in Inexor Core which produces
    //       a JSON formatted string, which can be parsed easily here
    //       for example:
    //       { "name": "global", "level": "info", "msg": "the log message text", "time": "2016-07-03T16:07:10.754Z" }
    let lines = data.toString('utf8').split("\n");
    for (var line of lines) {
      if (line.includes('[trace]')) {
        instanceLogger.trace(line);
      } else if (line.includes('[debug]')) {
        instanceLogger.debug(line);
      } else if (line.includes('[info]')) {
        instanceLogger.info(line);
      } else if (line.includes('[warning]')) {
        instanceLogger.warn(line);
      } else if (line.includes('[error]')) {
        instanceLogger.error(line);
      } else if (line.includes('[critical]')) {
        instanceLogger.fatal(line);
      } else {
        instanceLogger.debug(line);
      }
    }
  }

  /**
   * Writes to the console buffer.
   * @function
   * @param {number} instanceId The instance id.
   * @param {string} message The log message.
   * @param {string} level The log level.
   */
  writeBuffer(instanceId, message, level = 'info') {
    let logger = this.instancesNode.getChild(instanceId).console.logger.get();
    switch (level) {
      case 'trace':
        logger.trace(message);
        break;
      case 'debug':
        logger.debug(message);
        break;
      case 'info':
        logger.info(message);
        break;
      case 'warn':
        logger.warn(message);
        break;
      case 'error':
        logger.error(message);
        break;
      case 'fatal':
        logger.fatal(message);
        break;
    }
  }

  /**
   * Returns the contents of a ring buffer.
   * 
   * Example output: [ { name: 'foo', hostname: '912d2b29', pid: 50346, level: 30, msg: 'hello world', time: '2012-06-19T21:34:19.906Z', v: 0 } ]
   * 
   * TODO: use this from REST API.
   * TODO: create a CLI command which prints the last N messages of a specific console.
   * TODO: create a CLI command which tails on a specific console.
   * TODO: create a simple web app which shows 
   */
  getBuffer(instanceId) {
    return this.instancesNode.getChild(instanceId).console.buffer.get().records;
  }

}

module.exports = {
  ConsoleManager: ConsoleManager
}
