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
 * Management service for web user interfaces.
 */
class WebUserInterfaceManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(application_context) {
    super();
    this.root = application_context.get('tree');
    this.interfacesNode = this.root.getOrCreateNode('interfaces');
    this.scanForInterfaces();
  }

  /**
   * Creates a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   * @param {string} description The description of the web user interface.
   * @param {string} path The path to use on the web server of this Inexor Flex Instance.
   * @param {string} repository The URL of the remote git repository.
   */
  createInterface(name, description, path, repository) {
    let interfaceNode = this.interfacesNode.addNode(name);
    interfaceNode.addChild('name', 'string', name);
    interfaceNode.addChild('description', 'string', description);
    interfaceNode.addChild('path', 'string', path);
    interfaceNode.addChild('repository', 'string', repository);
    this.updateInterface(name);
  }

  /**
   * Returns true, if a web user interface exists with the given name.
   * @function
   * @param {string} name The name of the web user interface.
   */
  interfaceExists(name) {
    return this.interfacesNode.hasChild(name);
  }

  /**
   * Returns the local Removes a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  getPath(name) {
    if (this.interfaceExists(name)) {
      return this.interfacesNode.getChild(name).path;
    } else {
      return null;
    }
  }

  /**
   * Removes a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  removeInterface(name) {
    // TODO: implement
  }

  /**
   * Enables a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  enableInterface(name) {
    // TODO: implement
  }

  /**
   * Disables a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  disableInterface(name) {
    // TODO: implement
  }

  /**
   * Updates the local git repository to the latest revision of the remote
   * git repository.
   * 
   * @function
   * @param {string} name The name of the web user interface.
   */
  updateInterface(name) {
    // TODO: clone or pull/merge repository of the web user interface
  }

  /**
   * Loads a web user interface from TOML config.
   * @function
   */
  loadInterfaces() {
    // TODO: implement
  }

  /**
   * Scans for web user interfaces found locally.
   * @function
   */
  scanForInterfaces() {
    // TODO: implement
  }

  /**
   * Returns the list of interface names.
   * @function
   */
  getInterfaceNames() {
    // TODO: implement
    return [];
  }

}

module.exports = WebUserInterfaceManager;
