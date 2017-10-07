const EventEmitter = require('events');

/**
 * @module entities
 */

const Relationship = require('../domain/Relationship');

/**
 * Management service for relationships between entities.
 */
class RelationshipManager extends EventEmitter {

  /**
   * Constructs the RelationshipManager.
   * @param {object} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
    this.applicationContext = applicationContext;
    this.relationships = [];
    this.relationshipsByUuid = {};
  }

  /**
   * Creates a new relationship.
   * @param {RelationshipType} relationshipType - The relationship type.
   * @param {Entity} startEntity - The start entity.
   * @param {Entity} endEntity - The end entity.
   * @return {Relationship} The relationship.
   */
  create(relationshipType, startEntity, endEntity) {
    // TODO: prevent duplicate names!
    let relationship = new Relationship(relationshipType, startEntity, endEntity);
    this.relationships.push(relationship);
    this.relationshipsByUuid[relationship.getUuid()] = relationship;
    return relationship;
  }

  /**
   * Returns all relationships.
   * @return {Array.<Relationship>} The list of relationships.
   */
  getAll() {
    return this.relationships;
  }

  /**
   * Returns the relationship with the given uuid.
   * @param {string} uuid - The uuid of the relationship.
   * @return {Relationship} The relationship.
   */
  getByUuid(uuid) {
    if (this.relationshipsByUuid.hasOwnProperty(uuid)) {
      return this.relationshipsByUuid[uuid];
    } else {
      return null;
    }
  }

  /**
   * Removes the given relationship.
   * @param {Relationship} relationship - The relationship.
   */
  remove(relationship) {
    // The UUID is the primary reference!
    let uuid = relationship.getUuid();
    delete this.relationshipTypesByUuid[uuid];
    for (let i = 0; i < this.relationships.length; i++) {
      if (uuid == this.relationships[i].getUuid()) {
        // Disconnects the relationship
        relationship.disconnect();
        // Remove the relationship
        this.relationships.splice(i, 1);
        break;
      }
    }
  }

}

module.exports = RelationshipManager
