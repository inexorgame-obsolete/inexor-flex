/**
 * @module entities
 */

const RelationshipType = require('../domain/RelationshipType');

/**
 * Management service for relationship types.
 */
class RelationshipTypesManager extends EventEmitter {

  /**
   * Constructs the RelationshipTypeManager.
   * @param {object} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
    this.applicationContext = applicationContext;
    this.relationshipTypes = [];
    this.relationshipTypesByUuid = {};
    this.relationshipTypesByName = {};
  }

  /**
   * Creates a new relationship type.
   * @param {string} name - The name of the relationship type.
   * @return {RelationshipType} The relationship type.
   */
  create(name) {
    // TODO: prevent duplicate names!
    let relationshipType = new RelationshipType(name);
    this.relationshipTypes.push(relationshipType);
    this.relationshipTypesByUuid[relationshipType.getUuid()] = relationshipType;
    this.relationshipTypesByName[relationshipType.getName()] = relationshipType;
    return relationshipType;
  }

  /**
   * Returns all relationship types.
   * @return {Array.<RelationshipType>} The list of relationship types.
   */
  getAll() {
    return relationshipTypes;
  }

  /**
   * Returns the relationship type with the given uuid.
   * @param {string} uuid - The uuid of the relationship type.
   * @return {RelationshipType} The relationship type.
   */
  getByUuid(uuid) {
    if (this.relationshipTypesByUuid.hasOwnProperty(uuid)) {
      return this.relationshipTypesByUuid[uuid];
    } else {
      return null;
    }
  }

  /**
   * Returns the relationship type with the given name.
   * @param {string} name - The name of the relationship type.
   * @return {RelationshipType} The relationship type.
   */
  getByName(name) {
    if (this.relationshipTypesByName.hasOwnProperty(name)) {
      return this.relationshipTypesByName[name];
    } else {
      return null;
    }
  }

  /**
   * Removes the given relationship type.
   * @param {RelationshipType} relationshipType - The relationship type.
   */
  remove(relationshipType) {
    // The UUID is the primary reference!
    let uuid = relationshipType.getUuid();
    let relationshipType2 = this.relationshipTypesByUuid[uuid];
    let name = relationshipType2.getName();
    delete this.relationshipTypesByUuid[uuid];
    delete this.relationshipTypesByName[name];
    for (let i = 0; i < this.relationshipTypes.length; i++) {
      if (uuid == this.relationshipTypes[i].getUuid()) {
        this.relationshipTypes.splice(i, 1);
        break;
      }
    }
  }

}
