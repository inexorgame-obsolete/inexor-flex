const EventEmitter = require('events');

/**
 * @module entities
 */

const EntityType = require('../domain/EntityType');

/**
 * Management service for entity types.
 */
class EntityTypeManager extends EventEmitter {

  /**
   * Constructs the EntityTypeManager.
   * @param {object} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
    this.applicationContext = applicationContext;
    this.entityTypes = [];
    this.entityTypesByUuid = {};
  }

  /**
   * Creates a new entity type.
   * @param {string} name - The name of the entity type.
   * @return {EntityType} The entity type.
   */
  create(name) {
    let entityType = new EntityType(name);
    this.entityTypes.push(entityType);
    this.entityTypesByUuid[entityType.getUuid()] = entityType;
    return entityType;
  }

  /**
   * Returns all entity types.
   * @return {Array.<EntityType>} The list of entity types.
   */
  getAll() {
    return this.entityTypes;
  }

  /**
   * Returns the entity type with the given uuid.
   * @param {string} uuid - The uuid of the entity type.
   * @return {EntityType} The entity type.
   */
  getByUuid(uuid) {
    if (this.entityTypesByUuid.hasOwnProperty(uuid)) {
      return this.entityTypesByUuid[uuid];
    } else {
      return null;
    }
  }

  /**
   * Removes the given entity type (and all entities (and their relationships)).
   * @param {EntityType} entityType - The entity type.
   */
  remove(entityType) {
    // The UUID is the primary reference!
    let uuid = entityType.getUuid();
    delete this.entityTypesByUuid[uuid];
    for (let i = 0; i < this.entityTypes.length; i++) {
      let entityType = this.entityTypes[i];
      if (uuid == entityType.getUuid()) {
        // First remove all entities of this type
        for (let i = entityType.entities.length; i >= 0; i--) {
          // Removes the relationships of the entity
          entityType.entities[i].destroy();
          // Removes the entity from the list of entities
          entityType.entities.splice(i, 1);
        }
        // Finally remove the entity type itself
        this.entityTypes.splice(i, 1);
        break;
      }
    }
  }

}

module.exports = EntityTypeManager
