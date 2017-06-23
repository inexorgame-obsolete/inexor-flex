/**
 * @module gameclient
 */

const EventEmitter = require('events');
const util = require('util');

/**
 * Management of the screen of a game client. 
 */
class ScreenManager extends EventEmitter {

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
    this.log = this.applicationContext.get('logManager').getLogger('flex.gameclient.ScreenManager');

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
    instanceNode.on('enteredWindowedMode', this.onEnteredWindowMode.bind(this));
    instanceNode.on('enteredFullscreenMode', this.onEnteredFullscreenMode.bind(this));
  }

  /**
   * Spawn screenResized events.
   */
  onInstanceConnected(instanceNode) {
    try {
      if (instanceNode.type == 'client') {
        instanceNode.rendering.screen.getChild('scr_w').on('postSet', (changeSet) => {
          if (changeSet.oldValue != changeSet.newValue) {
            instanceNode.emit('screenResized', instanceNode, instanceNode.rendering.screen.scr_w, instanceNode.rendering.screen.scr_h);
          }
        });
        instanceNode.rendering.screen.getChild('scr_w').on('postSet', (changeSet) => {
          if (changeSet.oldValue != changeSet.newValue) {
            instanceNode.emit('screenResized', instanceNode, instanceNode.rendering.screen.scr_w, instanceNode.rendering.screen.scr_h);
          }
        });
        instanceNode.rendering.screen.getChild('fullscreen').on('postSet', (changeSet) => {
          if (changeSet.oldValue != changeSet.newValue) {
            switch (changeSet.newValue) {
              case 0:
                instanceNode.emit('enteredWindowedMode', instanceNode);
                break;
              case 1:
                instanceNode.emit('enteredFullscreenMode', instanceNode);
                break;
              default:
                break;
            }
          }
        });
      }
    } catch (err) {
      this.log.error(err);
    }
  }

  // Use cases for test purposes only

  onScreenResized(instanceNode, width, height) {
    this.log.debug(util.format('Resized screen of instance %s to %d x %d', instanceNode.getName(), width, height));
  }

  onEnteredWindowMode(instanceNode, width, height) {
    this.log.debug(util.format('Instance %s entered window mode', instanceNode.getName()));
  }

  onEnteredFullscreenMode(instanceNode, width, height) {
    this.log.debug(util.format('Instance %s entered fullscreen mode', instanceNode.getName()));
  }

}

module.exports = ScreenManager;
