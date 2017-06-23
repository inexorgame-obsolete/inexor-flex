/**
 * @module gameserver
 */

const EventEmitter = require('events');

/**
 * The map rotation service chooses 
 */
class MapRotationService extends EventEmitter {

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
    this.instancesNode.on('instanceCreated', (instanceNode) => {
      if (instanceNode.type == 'server') {
        this.loadMapRotation(instanceNode);
        instanceNode.on('intermission', this.onIntermission.bind(this));
      }
    });
  }

  loadMapRotation(instanceNode) {
    let gameplayNode = instanceNode.getOrCreateNode('gameplay');
    let maprotationNode = gameplayNode.getOrCreateNode('maprotation');
    let mapsNode = maprotationNode.getOrCreateNode('maps');
    mapsNode.getOrCreateNode('dust6');
    mapsNode.getOrCreateNode('pandora');
  }

  /**
   * Instance is in intermission mode.
   */
  onIntermission(instanceNode) {
    // TODO: rotation strategies
    this.setMap(instanceNode, this.getRandomMap(instanceNode))
  }

  /**
   * Changes the map.
   */
  setMap(instanceNode, map) {
    instanceNode.gameplay.map = map;
  }

  /**
   * Returns a random map.
   */
  getRandomMap(instanceNode) {
    let maps = instanceNode.gameplay.maprotation.maps.getChildNames();
    return maps[Math.floor(Math.random() * maps.length)];
  }

}

module.exports = MapRotationService;
