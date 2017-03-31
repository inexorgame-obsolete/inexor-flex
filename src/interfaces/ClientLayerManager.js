/**
 * @module interfaces
 */

const bunyan = require('bunyan');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

const debuglog = util.debuglog('instances');
const log = require('@inexor-game/logger')();

/**
 * Management service for CEF layers in Inexor Core Client.
 */
class ClientLayerManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(application_context) {
    super();
    this.webUserInterfaceManager = application_context.get('webUserInterfaceManager');
    this.root = application_context.get('tree');
    this.instancesNode = this.root.getOrCreateNode('instances');
  }

  /**
   * Creates a new layer on the Inexor Core Client with the given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   * @param {string} webUserInterface The name of the web user interface.
   * @param {boolean} acceptingMouseInput Whether the layer accepts mouse input.
   * @param {boolean} acceptingKeyInput Whether the layer accepts key input.
   */
  createLayer(instanceId, name, webUserInterface, acceptingMouseInput = false, acceptingKeyInput = false) {
    // TODO: implement
  }

  /**
   * Removes the layer with the given name on the Inexor Core Client with
   * the given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   */
  removeLayer(instanceId, name) {
    // TODO: implement
  }

  /**
   * Shows the layer with the given name on the Inexor Core Client with the
   * given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   */
  showLayer(instanceId, name) {
    // TODO: implement
  }

  /**
   * Hides the layer with the given name on the Inexor Core Client with the
   * given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   */
  hideLayer(instanceId, name) {
    // TODO: implement
  }

  /**
   * Sets the URL of the layer with the given name on the Inexor Core Client
   * with the given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   * @param {string} url The URL the set
   */
  setLayerUrl(instanceId, name, url) {
    // TODO: implement
    this.reloadLayer(instanceId, name);
  }

  /**
   * Reloads the layer with the given name on the Inexor Core Client with
   * the given instance id.
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   */
  reloadLayer(instanceId, name) {
    // TODO: implement
  }

  /**
   * Changes if the layer with the given name on the Inexor Core Client with
   * the given instance id is accepting mouse input. 
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   * @param {boolean} acceptingMouseInput If true, the layer accepts mouse input, else the layer ignores mouse input.
   */
  setAcceptingMouseInput(instanceId, name, acceptingMouseInput) {
    // TODO: implement
  }

  /**
   * Changes if the layer with the given name on the Inexor Core Client with
   * the given instance id is accepting key input. 
   * @function
   * @param {string} instanceId The id of the Inexor Core Client instance.
   * @param {string} name The id of the client instance.
   * @param {boolean} acceptingKeyInput If true, the layer accepts mouse input, else the layer ignores key input.
   */
  setAcceptingKeyInput(instanceId, name, acceptingKeyInput) {
    // TODO: implement
  }

}

module.exports = ClientLayerManager;
