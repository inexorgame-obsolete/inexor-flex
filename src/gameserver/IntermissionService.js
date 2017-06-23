/**
 * @module gameserver
 */

const EventEmitter = require('events');

/**
 * The map rotation service chooses 
 */
class IntermissionService extends EventEmitter {

  /**
   * @constructor
   * @param {ApplicationContext} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   * @function
   */
  setDependencies() {

    // The tree root
    this.root = this.applicationContext.get('tree');

    this.instancesNode = this.root.getOrCreateNode('instances');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {
    this.instancesNode.on('instanceCreated', this.onInstanceCreated.bind(this));
  }

  /**
   * If an server instance has been created, listen on intermission
   */
  onInstanceCreated(instanceNode) {
    instanceNode.gamestate.intermission.on('postSet', (oldValue, newValue) => {
      if (newValue == 1 && oldValue != 1) {
        instanceNode.emit('intermission', instanceNode);
      }
    });
  }

}

module.exports = IntermissionService;
