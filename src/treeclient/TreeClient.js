const Client = require('node-rest-client').Client;
const debuglog = require('util').debuglog('treeclient');

/**
 * The client for the local or remote Inexor Tree instances via a REST API.
 */
class TreeClient {

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

  createEndpoint(url, methodName, httpMethod = 'GET') {
    this.client.registerMethod(methodName, this.getEndpointUrl(url), httpMethod);
    var self = this;
    var fwrapper = function(...args) {
      self[methodName](...args);
    }
    return fwrapper;
  }

  getEndpointUrl(relPath) {
    return this.base_url + relPath;
  }

  callEndpoint(methodName, callback, path, data) {
    debuglog('Calling endpoint: ' + methodName);
    var args = {
      headers: { 'Content-Type': 'application/json' },
      path: path,
      data: data
    }
    this.client.methods[methodName](args, function(data, response) {
      debuglog(response.statusCode + ' ' + String(response.statusMessage));
      debuglog(String(data));
      debuglog(JSON.stringify(data));
      if (callback && typeof callback === 'function') callback(data, response);
    }).on('error', function(e) {
      debuglog('Error: ' + e.code);
    });
  }

  getAllInstances(callback) {
    this.callEndpoint(this.getAllInstances.name, callback);
  }

  getInstance(id, callback) {
    this.callEndpoint(this.getInstance.name, callback, { id: id });
  }

  createInstance(id, callback) {
    this.callEndpoint(this.createInstance.name, callback, { id: id }, { args: '', port: null });
  }

  removeInstance(id, callback) {
    this.callEndpoint(this.removeInstance.name, callback, { id: id });
  }

  startInstance(id, callback) {
    this.callEndpoint(this.startInstance.name, callback, { id: id });
  }

  startAllInstances(id, callback) {
    this.callEndpoint(this.startAllInstances.name, callback);
  }

  stopInstance(id, callback) {
    this.callEndpoint(this.stopInstance.name, callback, { id: id });
  }

  stopAllInstances(callback) {
    this.callEndpoint(this.stopAllInstances.name, callback);
  }

  connectInstance(id, callback) {
    this.callEndpoint(this.connectInstance.name, callback, { id: id });
  }

  synchronizeInstance(id, callback) {
    this.callEndpoint(this.synchronizeInstance.name, callback, { id: id });
  }

  shutdownFlex(callback) {
    this.callEndpoint(this.shutdownFlex.name, callback);
  }

  clientWindowFullscreen(id, mode, callback) {
    this.callEndpoint(this.clientWindowFullscreen.name, callback, { id: id, mode: mode });
  }

  clientWindowMaximize(id, callback) {
    this.callEndpoint(this.clientWindowMaximize.name, callback, { id: id });
  }

  clientWindowMinimize(id, callback) {
    this.callEndpoint(this.clientWindowMinimize.name, callback, { id: id });
  }

  clientWindowRestore(id, callback) {
    this.callEndpoint(this.clientWindowRestore.name, callback, { id: id });
  }

}

module.exports = TreeClient;
