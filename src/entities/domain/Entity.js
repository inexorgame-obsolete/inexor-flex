/**
 * @module entities
 */

// TODO: dependency: https://www.npmjs.com/package/uuid
const uuidV4 = require('uuid/v4');

/**
 * An instance of an entity.
 */
class Entity extends EventEmitter {

  /**
   * Constructs an entity.
   * @param {EntityType} entityType - The type of the entity.
   */
  constructor(entityType) {
    super();
    this.uuid = uuidV4();
    this.entityType = entityType;
    this.incomingRelationships = [];
    this.outgoingRelationships = [];
    this.entityType.register(this);
  }

  /**
   * Destroys an entity. Removes all relationships from an to this entity. Also unregisters the entity from the entity type.
   * TODO: check if this is enough to get being garbage collected.
   */
  destroy() {
    for (let i = this.incomingRelationships.length; i >= 0; i--) {
      this.incomingRelationships[i].disconnect();
    }
    for (let i = this.outgoingRelationships.length; i >= 0; i--) {
      this.incomingRelationships[i].disconnect();
    }
    this.entityType.unregister(this);
  }

  /**
   * Returns the UUID of the entity.
   * @return {string} The uuid of the entity.
   */
  getUuid() {
    return this.uuid;
  }

  /**
   * Returns the entity type.
   * @return {EntityType} The type of the entity.
   */
  getType() {
    return this.entityType;
  }

  /**
   * Returns the incoming relationships.
   * @param {RelationshipType} relationshipType - Restricts which types of relationships have to be respected or null for any type.
   * @return {Array.<Relationship>} The list of incoming relationships of the given type.
   */
  getIncomingRelationships(relationshipType) {
    if (relationshipType == null) {
      return this.incomingRelationships;
    } else {
      let incomingRelationships = [];
      for (let i = 0; i < this.incomingRelationships.length; i++) {
        let incomingRelationship = this.incomingRelationships[i];
        if (relationshipType.getUuid() == incomingRelationship.getType().getUuid()) {
          incomingRelationships.push(incomingRelationship);
        }
      }
      return incomingRelationships;
    }
  }

  /**
   * Returns the outgoing relationships.
   * @param {RelationshipType} relationshipType - Restricts which types of relationships have to be respected or null for any type.
   * @return {Array.<Relationship>} The list of outgoing relationships of the given type.
   */
  getOutgoingRelationships(relationshipType) {
    if (relationshipType == null) {
      return this.outgoingRelationships;
    } else {
      let outgoingRelationships = [];
      for (let i = 0; i < this.outgoingRelationships.length; i++) {
        let outgoingRelationship = this.outgoingRelationships[i];
        if (relationshipType.getUuid() == outgoingRelationship.getType().getUuid()) {
          outgoingRelationships.push(outgoingRelationship);
        }
      }
      return outgoingRelationships;
    }
  }

  /**
   * Returns the parent entities.
   * @param {RelationshipType} relationshipType - Restricts which types of relationships have to be respected or null for any type.
   * @return {Array.<Entity>} The parent entities.
   */
  getParentEntities(relationshipType) {
    let parents = [];
    for (let i = 0; i < this.incomingRelationships.length; i++) {
      let incomingRelationship = this.incomingRelationships[i];
      if (relationshipType == null || relationshipType.getUuid() == incomingRelationship.getType().getUuid()) {
        parents.push(incomingRelationship.getStartEntity());
      }
    }
    return parents;
  }

  /**
   * Returns the child entities.
   * @param {RelationshipType} relationshipType - Restricts which types of relationships have to be respected or null for any type.
   * @return {Array.<Entity>} The child entities.
   */
  getChildEntities(relationshipType) {
    let childs = [];
    for (let i = 0; i < this.outgoingRelationships.length; i++) {
      let outgoingRelationship = this.outgoingRelationships[i];
      if (relationshipType == null || relationshipType.getUuid() == outgoingRelationship.getType().getUuid()) {
        childs.push(outgoingRelationship.getEndEntity());
      }
    }
    return childs;
  }

  /**
   * Returns true, if an incoming relationship of the given type exists to the given entity.
   * @param {Entity} parentEntity - The parent entity.
   * @param {RelationshipType} relationshipType - The relationship type or null.
   * @return {Boolean} True, if parentEntity is a parent entity.
   */
  isParentEntity(parentEntity, relationshipType) {
    for (let i = 0; i < this.incomingRelationships.length; i++) {
      let incomingRelationship = this.incomingRelationships[i];
      if ((relationshipType == null || relationshipType.getUuid() == incomingRelationship.getType().getUuid()) && parentEntity.getUuid() == incomingRelationship.getStartEntity().getUuid()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true, if an outgoing relationship of the given type exists to the given entity.
   * @param {Entity} childEntity - The child entity.
   * @param {RelationshipType} relationshipType - The relationship type or null.
   * @return {Boolean} True, if childEntity is a child entity.
   */
  isChildEntity(childEntity, relationshipType) {
    for (let i = 0; i < this.outgoingRelationships.length; i++) {
      let outgoingRelationship = this.outgoingRelationships[i];
      if ((relationshipType == null || relationshipType.getUuid() == outgoingRelationship.getType().getUuid()) && childEntity.getUuid() == outgoingRelationship.getEndEntity().getUuid()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds a parent entity of the given type.
   * @param {RelationshipType} relationshipType - The relationship type. Must not be null.
   * @param {Entity} parentEntity - The parent entity.
   * @return {Relationship} - The created relationship.
   */
  addParent(relationshipType, parentEntity) {
    let relationship = new Relationship(relationshipType, parentEntity, this);
    return relationship;
  }

  /**
   * Adds a child entity of the given type.
   * @param {RelationshipType} relationshipType - The relationship type. Must not be null.
   * @param {Entity} childEntity - The child entity.
   * @return {Relationship} - The created relationship.
   */
  addChild(relationshipType, childEntity) {
    let relationship = new Relationship(relationshipType, this, childEntity);
    return relationship;
  }

  /**
   * Removes all relationships of the given type to the given parent entity.
   * @param {RelationshipType} relationshipType - The relationship type or null.
   * @param {Entity} parentEntity - The parent entity.
   */
  removeParentEntity(relationshipType, parentEntity) {
    for (let i = 0; i < this.incomingRelationships.length; i++) {
      let incomingRelationship = this.incomingRelationships[i];
      if ((relationshipType == null || relationshipType.getUuid() == incomingRelationship.getType().getUuid()) && parentEntity.getUuid() == incomingRelationship.getStartEntity().getUuid()) {
        incomingRelationship.disconnect();
        // don't skip
        i--;
      }
    }
  }

  /**
   * Removes all relationships of the given type to the given child entity.
   * @param {RelationshipType} relationshipType - The relationship type or null.
   * @param {Entity} childEntity - The child entity.
   */
  removeChildEntity(relationshipType, childEntity) {
    for (let i = 0; i < this.outgoingRelationships.length; i++) {
      let outgoingRelationship = this.outgoingRelationships[i];
      if ((relationshipType == null || relationshipType.getUuid() == outgoingRelationship.getType().getUuid()) && childEntity.getUuid() == outgoingRelationship.getEndEntity().getUuid()) {
        outgoingRelationship.disconnect();
        // don't skip
        i--;
      }
    }
  }

}
