/**
 * @module gameserver
 */

const EventEmitter = require('events');
const util = require('util');

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

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing instances
    this.instancesNode = this.root.getOrCreateNode('instances');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.gameserver.IntermissionService');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {
    this.instancesNode.on('created', this.onInstanceCreated.bind(this));
  }

  onInstanceCreated(instanceNode) {
    instanceNode.on('connected', this.onInstanceConnected.bind(this));
    // For test purposes only
    instanceNode.on('intermission', this.onIntermission.bind(this));
  }

  /**
   * If an server instance has been created, listen on intermission
   */
  onInstanceConnected(instanceNode) {
    try {
      instanceNode.gamestate.intermission.on('postSet', (changeSet) => {
        if (changeSet.newValue == 1 && changeSet.oldValue != 1) {
          instanceNode.emit('intermission', instanceNode);
        }
      });
    } catch (err) {
     // this.log.error(err);
    }
  }

  // For test purposes only

  onIntermission(instanceNode) {
    this.log.debug(util.format('Instance %s entered intermission', instanceNode.getName()));
  }

}

module.exports = IntermissionService;
