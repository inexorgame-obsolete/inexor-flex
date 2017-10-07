const EventEmitter = require('events');

/**
 * @module entities
 */

// TODO: dependency: https://www.npmjs.com/package/uuid
const uuidV4 = require('uuid/v4');

/**
 * The type of relationships.
 */
class RelationshipType extends EventEmitter {

  /**
   * Constructs a relationship type.
   * @param {string} name - The name of the relationship type.
   * 
   */
  constructor(name) {
    super();
    this.uuid = uuidV4();
    this.name = name;
  }

  /**
   * Returns the UUID of the relationship type.
   * @return {string} The uuid of the relationship type.
   */
  getUuid() {
    return this.uuid;
  }

  /**
   * Returns the name of the relationship type.
   * @return {string} The name of the relationship type.
   */
  getName() {
    return this.name;
  }

  /**
   * Registers an relationship of this relationship type.
   * @param {Relationship} relationship - The relationship to register.
   */
  register(relationship) {
    if (this.isRelationshipOfType(relationship) && !this.isRelationshipRegistered(relationship)) {
      this.relationships.push(relationship.getUuid());
    }
  }

  /**
   * Unregisters an relationship.
   * @param {Relationship} relationship - The relationship to unregister.
   */
  unregister(relationship) {
    for (let i = 0; i < this.relationships.length; i++) {
      if (relationship.getUuid() == this.relationships[i]) {
        this.relationships.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Returns true, if the given relationship is of the this type.
   * @param {Relationship} relationship - The relationship.
   * @return {Boolean} True, if the given relationship is of the this type.
   */
  isRelationshipOfType(relationship) {
    return this.uuid == relationship.getType().getUuid();
  }

  /**
   * Returns true, if the relationship is registered.
   * @param {Relationship} relationship - The relationship.
   * @return {Boolean} True, if the relationship is already registered.
   */
  isRelationshipRegistered(relationship) {
    for (let i = 0; i < this.relationships.length; i++) {
      if (relationship.getUuid() == this.relationships[i]) {
        return true;
      }
    }
    return false;
  }

}

module.exports = RelationshipType
