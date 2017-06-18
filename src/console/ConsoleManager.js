/**
 * Management of consoles.
 * @module console
 */

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
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
  constructor(applicationContext) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing instances
    this.instancesNode = this.root.getOrCreateNode('instances');

    /// The console manager service
    this.logManager = this.applicationContext.get('logManager');

    /// The class logger
    this.log = this.logManager.getLogger('flex.console.ConsoleManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {
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

      let streams = [
        {
          type: 'raw',
          stream: bunyanDebugStream({ forceColor: true })
        }, {
          level: 'trace',
          type: 'raw',
          stream: instanceConsoleBuffer
        }
      ];
      
      // Create the instance logger
      let loggerName = util.format('core.%s.%s', instanceType, instanceId);
      let instanceLogger = this.logManager.createStreamLogger(loggerName, true, null, 'trace', streams);

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
      line = line.trim();
      if (line.length > 0) {
        let entry = this.parseLine(line);
        instanceLogger[entry.level](entry.message);
      }
    }
  }

  getChildLogger(instanceLogger, name) {
    let logger = instanceLogger.child({
      name: name
    });
    logger.name = name;
    return logger;
  }

  parseLine(line) {
    let result = {};
    line = line.trim();
    result.date = line.substring(0, 8);
    line = line.substring(9);
    var regExp = /\[([^\]]+)\].+\[([^\]]+)\]/;
    var matches = regExp.exec(line);
    result.name = matches[1];
    result.level = this.mapLogLevel(matches[2]);
    result.message = line.substring(this.nthOcurrence(line, ']', 2) + 2);
    // this.log.info(JSON.stringify(result));
    return result;
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
    logger[this.mapLogLevel(level)](message);
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

  mapLogLevel(level) {
    switch (level) {
      case 'warning':
        return 'warn';
      case 'critical':
        return 'fatal';
      default:
        return level;
    }
  }

  nthOcurrence(str, search, position) {
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) == search) {
        if (!--position) {
          return i;    
        }
      }
    }
    return false;
  }

}

module.exports = ConsoleManager;
