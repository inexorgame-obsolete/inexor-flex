/**
 * @module entities
 */

const Entity = require('../domain/Entity');

/**
 * Management service for entities.
 */
class EntityManager extends EventEmitter {

  /**
   * Constructs the EntityManager.
   * @param {object} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
    this.applicationContext = applicationContext;
    this.entities = [];
    this.entitiesByUuid = {};
  }

  /**
   * Creates a new entity of the given type.
   */
  create(entityType) {
    let entity = new Entity(entityType);
    this.entities.push(entity);
    this.entitiesByUuid[entity.getUuid] = entity;
    return entity;
  }

  /**
   * Returns all entities.
   * @return {Array.<Entity>} The list of entities.
   */
  getAll() {
    return entities;
  }

  /**
   * Returns the entity with the given uuid.
   * @param {string} uuid - The uuid of the entity.
   * @return {Entity} The entity.
   */
  getByUuid(uuid) {
    if (this.entitiesByUuid.hasOwnProperty(uuid)) {
      return this.entitiesByUuid[uuid];
    } else {
      return null;
    }
  }

  remove(entity) {
    entity.destroy();
  }

}
