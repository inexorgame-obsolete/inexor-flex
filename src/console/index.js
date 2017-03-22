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
    this._instances_node = root.getOrCreateNode('instances');
  }

  /**
   * Create a new console for the given instance.
   */
  createConsole(instance_id, maxRecords = 100) {
    let buffer = new bunyan.RingBuffer({ limit: maxRecords });
    let stdout_stream = {
      level: 'info',
      stream: process.stdout
    };
    let buffer_stream = {
      level: 'trace',
      // use 'raw' to get raw log record objects
      type: 'raw',    
      stream: buffer
    };
    let console_name = 'instance-' + instance_id;
    let instance_logger = bunyan.createLogger({
      name: console_name,
      streams: [ stdout_stream, buffer_stream ]
    });
    let console_node = this._instances_node.getChild(instance_id).getOrCreateNode('console');
    console_node.addChild('logger', 'object', instance_logger, false);
    console_node.addChild('buffer', 'object', buffer, false);
    
    // either:
    // a) read from stdout and stderr => write into buffer
    // b) add a new datatype to the tree: stream
    //    stream doesn't store any data
    //    but Node.set() still fires preSet and postSet events 
    //    so you can subscribe on the tree node and receive the stream data
    //    + create a spdlogger sink for streaming to a tree node
  }

  /**
   * Returns the logger for the given instance.
   */
  getInstanceLogger(instance_id) {
    return this._instances_node.getChild(instance_id).console.logger.get();
  }

  /**
   * Writes to the console buffer.
   */
  writeBuffer(instance_id, message) {
    this._instances_node.getChild(instance_id).console.logger.get().info(message);
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
  getBuffer(instance_id) {
    return this._instances_node.getChild(instance_id).console.buffer.get().records;
  }

}

module.exports = ConsoleManager
