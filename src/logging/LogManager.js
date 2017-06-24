/**
 * @module logging
 */

const EventEmitter = require('events');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fs = require('fs');
const path = require('path');
const toml = require('toml');
const tomlify = require('tomlify');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

/**
 * Logging configuration.
 */
class LogManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(applicationContext) {
    super();

    // Keeping references of every logger by name
    this.loggers = {};

  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The profile manager service
    this.profileManager = this.applicationContext.get('profileManager');

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing the logging configuration
    this.loggingNode = this.root.getOrCreateNode('logging');

    // The class logger
    this.log = this.createLogger('flex.logging.LogManager');
    
  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    // Loading the logging configuration
    this.loadLogConfiguration();

  }

  /**
   * Removes all logging configuration from the tree.
   */
  clear() {
    return new Promise((resolve, reject) => {
      this.loggingNode.removeAllChildren();
      resolve(true);
    });
  }

  /**
   * Creates a new logger
   * @param {string} name - The logger name.
   * @param {boolean} console - If true the logger logs to stdout.
   * @param {string} file - The filename to log to or null.
   * @param {string} level - The log level.
   */
  createLogger(name, console = true, file = null, level = 'info') {
    let streams = [];
    if (console) {
     streams.push({
       type: 'raw',
       stream: bunyanDebugStream({ forceColor: true })
     })
    }
    if (file != null && file != 'null') {
     streams.push({
       path: file
     })
    }
    return this.createStreamLogger(name, console, file, level, streams);
  }

  createStreamLogger(name, console = true, file = null, level = 'info', streams = []) {
    if (!this.loggers.hasOwnProperty(name)) {

      // Create tree structure
      let parts = name.split('.');
      var treeNode = this.loggingNode;
      for (let i = 0; i < parts.length; i++) {
        treeNode = treeNode.getOrCreateNode(parts[i]);
      }
      let levelNode = treeNode.addChild('level', 'string', level);
      let consoleNode = treeNode.addChild('console', 'bool', console);
      let fileNode = treeNode.addChild('file', 'string', file == null ? 'null' : file);

      // Create new logger
      this.loggers[name] = bunyan.createLogger({
        name: name,
        level: level,
        streams: streams,
        serializers: bunyanDebugStream.serializers
      });

      // Listen on log level changes in the tree
      levelNode.on('postSet', (event) => {
        if (event.oldValue != event.newValue) {
          this.loggers[name].level(event.newValue);
          this.log.info(util.format('Reconfigured logger %s (level: %s)', name, event.newValue));
        }
      });

      // Log about loggers
      if (this.log != null) {
        this.log.info(util.format('Created logger %s (level: %s, console: %s, file: %s)', name, level, String(console), String(file)));
      }

    } else {

      // Update tree structure
      let parts = name.split('.');
      var treeNode = this.loggingNode;
      for (let i = 0; i < parts.length; i++) {
        treeNode = treeNode.getOrCreateNode(parts[i]);
      }
      
      // Update the log level (tree node event)
      treeNode.level = level;
      treeNode.console = console;
      treeNode.file = file == null ? 'null' : file;

      // Reconfigure existing logger
      var logger = this.getLogger(name)
      logger.streams = [];
      for (var i = 0; i < streams.length; i++) {
        logger.addStream(streams[i]);
      }

    }
    return this.loggers[name];
  }

  /**
   * Returns the logger with the given name.
   * @param {string} name - The logger name.
   */
  getLogger(name) {
    if (this.loggers.hasOwnProperty(name)) {
      return this.loggers[name];
    } else {
      return this.createLogger(name);
    }
  }

  /**
   * Sets the log level of the given logger to the given level.
   * @param {string} name - The logger name.
   */
  setLoglevel(name, level) {
    this.getLogger(name).level(level);
  }

  /**
   * Loads the logging configuration from file.
   * @function
   * @param {string} filename - The filename of the logging configuration.
   */
  loadLogConfiguration(filename = 'logging.toml') {
    let configPath = this.profileManager.getConfigPath(filename);
    this.log.info(util.format('Loading logging configuration from %s', configPath));
    let data = fs.readFileSync(configPath);
    let config = toml.parse(data.toString());
    this.createSubLoggersRecursively(config.logging, null);
  }

  createSubLoggersRecursively(config, parent) {
    for (let name of Object.keys(config)) {
      switch (name) {
        case 'level':
        case 'console':
        case 'file':
          break;
        default:
          this.createLoggerRecursively(name, config[name], parent);
      }
    }
  }
  
  createLoggerRecursively(name, config, parent) {
    let lname = (parent == null) ? name : util.format('%s.%s', parent.name, name);

    var log = {
      name: lname,
      level: 'info',
      console: true,
      file: null
    };

    if (config.hasOwnProperty('level')) {
      log.level = config.level;
    } else if (parent != null) {
      log.level = parent.level;
    }

    if (config.hasOwnProperty('console')) {
      log.console = config.console;
    } else if (parent != null) {
      log.console = parent.console;
    }

    if (config.hasOwnProperty('file')) {
      if (config.file == 'null') {
        log.file = null;
      } else {
        log.file = config.file;
      }
    } else if (parent != null) {
      log.file = parent.file;
    }

    // Create the logger
    this.createLogger(log.name, log.console, log.file, log.level, false);

    // Create sub loggers
    this.createSubLoggersRecursively(config, log);

  }
  
  
}

module.exports = LogManager;
