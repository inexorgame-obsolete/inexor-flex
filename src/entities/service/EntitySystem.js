const EventEmitter = require('events');

/**
 * @module entities
 */

const EntityManager = require('./EntityManager');
const EntityTypeManager = require('./EntityTypeManager');
const RelationshipManager = require('./RelationshipManager');
const RelationshipTypeManager = require('./RelationshipTypeManager');

/**
 * The main API for the entity system.
 */
class EntitySystem extends EventEmitter {

  /**
   * Constructs the EntitySystem.
   * @param {object} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();
    this.applicationContext = applicationContext;
    this.entityManager = new EntityManager(applicationContext);
    this.entityTypeManager = new EntityTypeManager(applicationContext);
    this.relationshipManager = new RelationshipManager(applicationContext);
    this.relationshipTypeManager = new RelationshipTypeManager(applicationContext);
  }

  /**
   * Returns the EntityManager.
   * @return {EntityManager} The entity manager.
   */
  getEntityManager() {
    return this.entityManager;
  }

  /**
   * Returns the EntityTypeManager.
   * @return {EntityTypeManager} The entity type manager.
   */
  getEntityTypeManager() {
    return this.entityTypeManager;
  }

  /**
   * Returns the RelationshipManager.
   * @return {RelationshipManager} The relationship manager.
   */
  getRelationshipManager() {
    return this.relationshipManager;
  }

  /**
   * Returns the RelationshipTypeManager.
   * @return {RelationshipTypeManager} The relationship type manager.
   */
  getRelationshipTypeManager() {
    return this.relationshipTypeManager;
  }

}

module.exports = EntitySystem
