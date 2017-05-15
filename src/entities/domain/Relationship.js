/**
 * @module entities
 */

// TODO: dependency: https://www.npmjs.com/package/uuid
const uuidV4 = require('uuid/v4');

/**
 * An instance of a relationship between two entities.
 * 
 * The relationship defines a connection between an start node
 * and an end node.
 * 
 * The relationship is of a relationship type.
 * 
 */
class Relationship extends EventEmitter {

  /**
   * Constructs a relationship.
   * @param {RelationshipType} relationshipType - The type of the relationship.
   * @param {Entity} startEntity - The start entity.
   * @param {Entity} endEntity - The end entity.
   * 
   */
  constructor(relationshipType, startEntity, endEntity) {
    super();
    this.uuid = uuidV4();
    this.relationshipType = relationshipType;
    this.startEntity = startEntity;
    this.endEntity = endEntity;
    this.startEntity.outgoingRelationships.push(this);
    this.endEntity.incomingRelationships.push(this);
    this.relationshipType.register(this);
  }

  /**
   * Returns the UUID of the relationship.
   * @return {string} The uuid of the relationship.
   */
  getUuid() {
    return this.uuid;
  }

  /**
   * Returns the type of the relationship.
   * @return {RelationshipType} The relationship type.
   */
  getType() {
    return this.relationshipType;
  }

  /**
   * Returns the start entity.
   * @return {Entity} The start entity.
   */
  getStartEntity() {
    return this.startEntity;
  }

  /**
   * Returns the end entity.
   * @return {Entity} The end entity.
   */
  getEndEntity() {
    return this.endEntity;
  }

  /**
   * Disconnects the relationship from both ends.
   */
  disconnect() {
    for (let i = 0; i < this.startEntity.outgoingRelationships.length; i++) {
      let outgoingRelationship = this.startEntity.outgoingRelationships[i];
      if (this.uuid == outgoingRelationship.getUuid()) {
        this.startEntity.outgoingRelationships.splice(i, 1);
        break;
      }
    }
    for (let i = 0; i < this.endEntity.incomingRelationships.length; i++) {
      let incomingRelationship = this.endEntity.incomingRelationships[i];
      if (this.uuid == incomingRelationship.getUuid()) {
        this.endEntity.incomingRelationships.splice(i, 1);
        break;
      }
    }
  }

}
