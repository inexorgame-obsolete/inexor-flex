/**
 * @module interfaces
 * Management of the web user interfaces and client layers.
 */

const WebUserInterfaceManager = require('./WebUserInterfaceManager');
const ClientLayerManager = require('./ClientLayerManager');

module.exports = {
  WebUserInterfaceManager: WebUserInterfaceManager,
  ClientLayerManager: ClientLayerManager
}
