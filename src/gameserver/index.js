/**
 * Management of inexor game servers.
 * @module gameserver
 */

const IntermissionService = require('./IntermissionService');
const MapRotationService = require('./MapRotationService');

module.exports = {
  IntermissionService: IntermissionService,
  MapRotationService: MapRotationService
}
