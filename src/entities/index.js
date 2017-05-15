/**
 * The entity system of Inexor.
 * @module entities
 */

const Entity = require('./domain/Entity');
const EntityType = require('./domain/EntityType');
const Relationship = require('./domain/Relationship');
const RelationshipType = require('./domain/RelationshipType');

const EntitySystem = require('./service/EntitySystem');
const EntityManager = require('./service/EntityManager');
const EntityTypeManager = require('./service/EntityTypeManager');
const RelationshipManager = require('./service/RelationshipManager');
const RelationshipTypeManager = require('./service/RelationshipTypeManager');

module.exports = {
  EntitySystem: EntitySystem,
  Entity: Entity,
  EntityType: EntityType,
  Relationship: Relationship,
  RelationshipType: RelationshipType,
  EntityManager: EntityManager,
  EntityTypeManager: EntityTypeManager,
  RelationshipManager: RelationshipManager,
  RelationshipTypeManager: RelationshipTypeManager
}
