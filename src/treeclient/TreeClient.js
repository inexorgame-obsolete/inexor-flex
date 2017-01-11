const Client = require('node-rest-client').Client;
const log = require('@inexor-game/logger')();

/**
 * The client for the local or remote Inexor Tree instances via a REST API.
 * @see {@link https://www.npmjs.com/package/node-rest-client}
 */
class TreeClient {
  /**
   * @constructor
   * @type {string} hostname - the hostname flex listens on
   * @type {number} port - the port that flex listens on
   * @type {number} api_version - the api version that should be used
   */
  constructor(hostname = 'localhost', port = 31416, api_version = 1) {
    this.client = new Client();
    this.hostname = hostname;
    this.port = port;
    this.api_version = api_version;
    this.base_url = 'http://' + hostname + ':' + port + '/api/v' + api_version;
    this.flex = {
      instances: {
        getAll: this.createEndpoint('/instances', this.getAllInstances.name),
        get: this.createEndpoint('/instances/${id}', this.getInstance.name),
        create: this.createEndpoint('/instances/${id}', this.createInstance.name, 'POST'),
        remove: this.createEndpoint('/instances/${id}', this.removeInstance.name, 'DELETE'),
        start: this.createEndpoint('/instances/${id}/start', this.startInstance.name),
        startAll: this.createEndpoint('/instances/start', this.startAllInstances.name),
        stop: this.createEndpoint('/instances/${id}/stop', this.stopInstance.name),
        stopAll: this.createEndpoint('/instances/stop', this.stopAllInstances.name),
        connect: this.createEndpoint('/instances/${id}/connect', this.connectInstance.name),
        synchronize: this.createEndpoint('/instances/${id}/synchronize', this.synchronizeInstance.name),
        client: {
          window: {
            fullscreen: this.createEndpoint('/instances/${id}/window/fullscreen/${mode}', this.clientWindowFullscreen.name),
            maximize: this.createEndpoint('/instances/${id}/window/maximize', this.clientWindowMaximize.name),
            minimize: this.createEndpoint('/instances/${id}/window/minimize', this.clientWindowMinimize.name),
            restore: this.createEndpoint('/instances/${id}/window/restore', this.clientWindowRestore.name)
          }
        }
      },
      shutdown: this.createEndpoint('/flex/shutdown', 'shutdownFlex')
    }
  }

  /**
   * Creates an endpoint within the Inexor Tree Client
   * @function
   * @type {string} url - the url
   * @type {string} methodName - the name of the method to be called
   * @type {httpMethod} httpMethod - the http method to be used
   */
  createEndpoint(url, methodName, httpMethod = 'GET') {
    this.client.registerMethod(methodName, this.getEndpointUrl(url), httpMethod);
    var self = this;
    var fwrapper = function(...args) {
      self[methodName](...args);
    }
    return fwrapper;
  }

  /**
   * Gets an endpoint url's path
   * @function
   * @param {string} relPath - the relative path to be looked up
   * @return {string}
   */
  getEndpointUrl(relPath) {
    return this.base_url + relPath;
  }

  /**
   * Calls an endpoint
   * @function
   * @param {string} methodName - the method name to be called
   * @param {function} callback - the callback to be feeded with data
   * @param {string} path - the path to call
   * @param {mixed} data - the data to supply to the endpoint
   */
  callEndpoint(methodName, callback, path, data) {
    log.info('Calling endpoint: ' + methodName);
    var args = {
      headers: { 'Content-Type': 'application/json' },
      path: path,
      data: data
    }
    this.client.methods[methodName](args, function(data, response) {
      log.info(response.statusCode + ' ' + String(response.statusMessage));
      log.info(String(data));
      log.info(JSON.stringify(data));
      if (callback && typeof callback === 'function') callback(data, response);
    }).on('error', function(e) {
      log.info('Error: ' + e.code);
    });
  }

  /**
   * Returns all the instances to the callback
   * @function
   * @param {function} callback
   */
  getAllInstances(callback) {
    this.callEndpoint(this.getAllInstances.name, callback);
  }

  /**
   * Returns the instances to the callback
   * @function
   * @param {number} id - the instance id
   * @param {function} callback
   */
  getInstance(id, callback) {
    this.callEndpoint(this.getInstance.name, callback, { id: id });
  }

  /**
   * Created an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  createInstance(id, callback) {
    this.callEndpoint(this.createInstance.name, callback, { id: id }, { args: '', port: null });
  }

  /**
   * Removes an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  removeInstance(id, callback) {
    this.callEndpoint(this.removeInstance.name, callback, { id: id });
  }

  /**
   * Starts an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  startInstance(id, callback) {
    this.callEndpoint(this.startInstance.name, callback, { id: id });
  }

  /**
   * Starts all available instances
   * @function
   * @param {function} callback
   */
  startAllInstances(callback) {
    this.callEndpoint(this.startAllInstances.name, callback);
  }

  /**
   * Stops an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  stopInstance(id, callback) {
    this.callEndpoint(this.stopInstance.name, callback, { id: id });
  }

  /**
   * Stops all available instances
   * @function
   * @param {function} callback
   */
  stopAllInstances(callback) {
    this.callEndpoint(this.stopAllInstances.name, callback);
  }

  /**
   * Connects an instance to it's core
   * @function
   * @param {number} id
   * @param {function} callback
   */
  connectInstance(id, callback) {
    this.callEndpoint(this.connectInstance.name, callback, { id: id });
  }

  /**
   * Synchronizes an instance with it's core
   * @function
   * @param {number} id
   * @param {function} callback
   */
  synchronizeInstance(id, callback) {
    this.callEndpoint(this.synchronizeInstance.name, callback, { id: id });
  }

  /**
   * Shuts down the flex server
   * @function
   * @param {function} callback
   */
  shutdownFlex(callback) {
    this.callEndpoint(this.shutdownFlex.name, callback);
  }

  /**
   * Sets the instance (client) to specified window mode.
   * @function
   * @param {number} id
   * @param {string} mode
   * @param {function} callback
   */
  clientWindowFullscreen(id, mode, callback) {
    this.callEndpoint(this.clientWindowFullscreen.name, callback, { id: id, mode: mode });
  }

  /**
   * Maximies the window for given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowMaximize(id, callback) {
    this.callEndpoint(this.clientWindowMaximize.name, callback, { id: id });
  }

  /**
   * Minimizes the window for given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowMinimize(id, callback) {
    this.callEndpoint(this.clientWindowMinimize.name, callback, { id: id });
  }

  /**
   * Restores the window for a given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowRestore(id, callback) {
    this.callEndpoint(this.clientWindowRestore.name, callback, { id: id });
  }

}

module.exports = TreeClient;
