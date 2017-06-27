/**
 * @module media
 */

const EventEmitter = require('events');

/**
 * The map rotation service chooses 
 */
class MapManager extends EventEmitter {

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

    /// The tree root
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// The server list node
    this.mapsNode = this.mediaNode.getOrCreateNode('maps');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.MapManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {

  }

  /**
   * Returns the names of the maps.
   * @function
   */
  getMapNames() {
    return this.mapsNode.getChildNames();
  }

}

module.exports = MapManager;
