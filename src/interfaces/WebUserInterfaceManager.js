const bunyan = require('bunyan');
const EventEmitter = require('events');
const express = require('express');
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
  constructor(applicationContext) {
    super();

  }

  /**
   * Sets the dependencies from the application context.
   * @function
   */
  setDependencies() {

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The router of the Inexor Flex webserver
    this.router = this.applicationContext.get('router');

    /// The Inexor Tree node containing interfaces
    this.interfacesNode = this.root.getOrCreateNode('interfaces');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.interfaces.WebUserInterfaceManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {

    /// Scan for interfaces in the interfaces folder (WIP)
    // this.scanForInterfaces();
    
    // Temporarily solution: manual creation of interfaces

    /// Inexor Flex User Interface
    this.createInterface('ui-flex', 'Inexor Flex User Interface', 'ui-flex', 'dist', 'https://github.com/inexorgame/ui-flex.git');

    /// Inexor Web Console
    this.createInterface('ui-console', 'Inexor Web Console', 'ui-console', 'public', 'https://github.com/inexorgame/ui-console.git');

    /// Inexor Core Client HUD
    this.createInterface('ui-client-hud', 'Inexor Core Client HUD', 'ui-client-hud', 'public', 'https://github.com/inexorgame/ui-client-hud.git');

    // TODO: menu UI

    /// Inexor Core Client Interface
    this.createInterface('ui-client-interface', 'Inexor Core Client Interface', 'ui-client-interface', 'public', 'https://github.com/inexorgame/ui-client-interface.git');

  }

  /**
   * Creates a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   * @param {string} description The description of the web user interface.
   * @param {string} path The path to use on the web server of this Inexor Flex Instance (http://host:port/api/v1/interfaces/:path).
   * @param {string} folder The folder to be delivered (:flex_base_folder/interfaces/:path/:folder).
   * @param {string} repository The URL of the remote git repository.
   */
  createInterface(name, description, path, folder, repository) {
    let interfaceNode = this.interfacesNode.addNode(name);
    interfaceNode.addChild('name', 'string', name);
    interfaceNode.addChild('description', 'string', description);
    interfaceNode.addChild('path', 'string', path);
    interfaceNode.addChild('folder', 'string', folder);
    interfaceNode.addChild('repository', 'string', repository);
    interfaceNode.addChild('enabled', 'bool', false);
    interfaceNode.addChild('relativeFsPath', 'string', '');
    interfaceNode.addChild('absoluteFsPath', 'string', '');
    interfaceNode.addChild('relativeUrl', 'string', '');
    interfaceNode.addChild('fullUrl', 'string', '');
    this.updateInterfaceNode(name);
    this.updateInterface(name);
    this.enableInterface(name);
  }

  /**
   * Updates the tree node values for the given user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  updateInterfaceNode(name) {
    let interfaceNode = this.interfacesNode.getChild(name);
    interfaceNode.relativeFsPath = this.getRelativeFsPath(name);
    interfaceNode.absoluteFsPath = this.getAbsoluteFsPath(name);
    interfaceNode.relativeUrl = this.getRelativeUrl(name);
    interfaceNode.fullUrl = this.getFullUrl(name);
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
    let interfaceNode = this.interfacesNode.removeChild(name);
    
  }

  /**
   * Enables a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  enableInterface(name) {
    let interfaceNode = this.interfacesNode.getChild(name);
    this.router.use(interfaceNode.relativeUrl, express.static(interfaceNode.absoluteFsPath));
    this.log.info(util.format('Enabled user interface %s on %s', interfaceNode.absoluteFsPath, interfaceNode.fullUrl));
    interfaceNode.enabled = true;
  }

  /**
   * Disables a web user interface.
   * @function
   * @param {string} name The name of the web user interface.
   */
  disableInterface(name) {
    this.interfaceNode.enabled = false;
    // TODO: implement
    // see https://github.com/expressjs/express/issues/2596
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
    this.log.warn('Not implemented updating an user interface');
  }

  /**
   * Loads a web user interface from TOML config.
   * @function
   */
  loadInterfaces() {
    // TODO: implement
    this.log.warn('Not implemented loading user interfaces from TOML');
  }

  /**
   * Scans for web user interfaces found locally.
   * @function
   */
  scanForInterfaces() {
    // TODO: implement
    this.log.warn('Not implemented scanning for user interfaces');
  }

  /**
   * Returns the list of interface names.
   * @function
   * @return {array} The names of the user interfaces
   */
  getInterfaceNames() {
    return this.interfacesNode.getChildNames();
  }

  /**
   * Returns the filesystem path relative to Inexor Flex.
   * @function
   * @param {string} name The name of the web user interface.
   */
  getRelativeFsPath(name) {
    let interfaceNode = this.interfacesNode.getChild(name);
    return util.format('interfaces/%s/%s', interfaceNode.path, interfaceNode.folder);
  }

  /**
   * Returns the absolute filesystem path.
   * @function
   * @param {string} name The name of the web user interface.
   */
  getAbsoluteFsPath(name) {
    return path.resolve(this.getRelativeFsPath(name));
  }

  /**
   * Returns the URL
   * @function
   * @param {string} name The name of the web user interface.
   */
  getRelativeUrl(name) {
    let interfaceNode = this.interfacesNode.getChild(name);
    return util.format('/interfaces/%s/', interfaceNode.path);
  }

  /**
   * Returns the full URL
   * @function
   * @param {string} name The name of the web user interface.
   */
  getFullUrl(name) {
    let interfaceNode = this.interfacesNode.getChild(name);
    return util.format('/api/v1/interfaces/%s/', interfaceNode.path);
  }

}

module.exports = WebUserInterfaceManager;
