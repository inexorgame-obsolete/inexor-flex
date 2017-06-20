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
    this.updateInterface(name);
    this.enableInterface(name);
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
    let interfaceNode = this.interfacesNode.getChild(name);
    let fs_path = util.format('interfaces/%s/%s', interfaceNode.path, interfaceNode.folder);
    let base_url = util.format('/interfaces/%s/', interfaceNode.path);
    this.router.use(base_url, express.static(path.resolve(fs_path)));
    this.log.info(util.format('Enabled user interface %s on %s', path.resolve(fs_path), base_url));
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
