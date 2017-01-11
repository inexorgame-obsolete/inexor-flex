const Client = require('node-rest-client').Client;

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
        getAll: this.createEndpoint('/instances', 'getAllInstances'),
        get: this.createEndpoint('/instances/${id}', 'getInstance'),
        create: this.createEndpoint('/instances/${id}', 'createInstance', 'POST'),
        remove: this.createEndpoint('/instances/${id}', 'removeInstance', 'DELETE'),
        start: this.createEndpoint('/instances/${id}/start', 'startInstance'),
        stop: this.createEndpoint('/instances/${id}/stop', 'stopInstance'),
        connect: this.createEndpoint('/instances/${id}/connect', 'connectInstance'),
        synchronize: this.createEndpoint('/instances/${id}/synchronize', 'synchronizeInstance')
      }
    }
  }

  createEndpoint(url, methodName, httpMethod = 'GET') {
    this.client.registerMethod(methodName, this.getEndpointUrl(url), httpMethod);
    var self = this;
    var fwrapper = function() {
      self[methodName](arguments);
    }
    return fwrapper;
  }

  getEndpointUrl(relPath) {
    return this.base_url + relPath;
  }

  callEndpoint(methodName, callback, path, data) {
    console.log('Calling endpoint: ' + methodName);
    var args = {
      headers: { 'Content-Type': 'application/json' },
      path: path,
      data: data
    }
    console.log(args);
    this.client.methods[methodName](args, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      console.log(JSON.stringify(data));
      if (callback && typeof callback === 'function') callback(data, response);
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

  stopInstance(id, callback) {
    this.callEndpoint(this.stopInstance.name, callback, { id: id });
  }

  connectInstance(id, callback) {
    this.callEndpoint(this.connectInstance.name, callback, { id: id });
  }

  synchronizeInstance(id, callback) {
    this.callEndpoint(this.synchronizeInstance.name, callback, { id: id });
  }

}

module.exports = TreeClient;
