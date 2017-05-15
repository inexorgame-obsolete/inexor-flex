/**
 * @module entities
 */

// TODO: dependency: https://www.npmjs.com/package/uuid
const uuidV4 = require('uuid/v4');

/**
 * The type of entities.
 */
class EntityType extends EventEmitter {

  /**
   * Constructs an entity type.
   * @param {string} name - The name of the entity type.
   * 
   */
  constructor(name) {
    super();
    this.uuid = uuidV4();
    this.name = name;
    
    // List of UUIDs only
    this.entities = [];
  }

  /**
   * Returns the UUID of the entity type.
   * @return {string} The uuid of the entity type.
   */
  getUuid() {
    return this.uuid;
  }

  /**
   * Returns the name of the entity type.
   * @return {string} The name of the entity type.
   */
  getName() {
    return this.name;
  }

  /**
   * Returns all entities of this type.
   * @return {Array} The list of entities of this type.
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Registers an entity of this entity type.
   * @param {Entity} entity - The entity to register.
   */
  register(entity) {
    if (this.isEntityOfType(entity) && !this.isEntityRegistered(entity)) {
      this.entities.push(entity.getUuid());
    }
  }

  /**
   * Unregisters an entity.
   * @param {Entity} entity - The entity to unregister.
   */
  unregister(entity) {
    for (let i = 0; i < this.entities.length; i++) {
      if (entity.getUuid() == this.entities[i]) {
        this.entities.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Returns true, if the given entity is of the this type.
   * @param {Entity} entity - The entity.
   * @return {Boolean} True, if the given entity is of the this type.
   */
  isEntityOfType(entity) {
    return this.uuid == entity.getType().getUuid();
  }

  /**
   * Returns true, if the entity is registered.
   * @param {Entity} entity - The entity.
   * @return {Boolean} True, if the given entity is already registered.
   */
  isEntityRegistered(entity) {
    for (let i = 0; i < this.entities.length; i++) {
      if (entity.getUuid() == this.entities[i]) {
        return true;
      }
    }
    return false;
  }

}
