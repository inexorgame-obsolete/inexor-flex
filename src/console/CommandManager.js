/**
 * Management of consoles.
 * @module console
 */

const EventEmitter = require('events');

/**
 * The console manager stores a ring buffer for each instance.
 */
class CommandManager extends EventEmitter {

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
    this.log = this.logManager.getLogger('flex.console.CommandManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {
  }

}

module.exports = CommandManager;
