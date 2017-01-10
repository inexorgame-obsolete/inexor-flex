const Client = require('node-rest-client').Client;

var client = new Client();

/**
 * The client to local or remote Inexor Trees via a REST API.
 */
class TreeClient {

  constructor(hostname = 'localhost', port = 31416, api_version = 1) {
    let base_url = 'http://' + hostname + ':' + port + '/api/v' + api_version;
    console.log(base_url);
    client.registerMethod('getAllInstances', base_url + '/instances', 'GET');
    client.registerMethod('getInstance', base_url + '/instances/${id}', 'GET');
    client.registerMethod('createInstance', base_url + '/instances/${id}', 'POST');
    client.registerMethod('removeInstance', base_url + '/instances/${id}', 'DELETE');
    client.registerMethod('startInstance', base_url + '/instances/${id}/start', 'GET');
    client.registerMethod('stopInstance', base_url + '/instances/${id}/stop', 'GET');
    client.registerMethod('connectInstance', base_url + '/instances/${id}/connect', 'GET');
    client.registerMethod('synchronizeInstance', base_url + '/instances/${id}/synchronize', 'GET');
    this.flex = {
      instances: {
        getAll: this.getAllInstances,
        get: this.getInstance,
        create: this.createInstance,
        remove: this.removeInstance,
        start: this.startInstance,
        stop: this.stopInstance,
        connect: this.connectInstance,
        synchronize: this.synchronizeInstance
      }
    }
  }
  getAllInstances(f) {
    client.methods.getAllInstances(function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(JSON.stringify(data));
      if (f) f(data, response);
    });
  }
  getInstance(id, f) {
    client.methods.getInstance({ path: { id: id }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(JSON.stringify(data));
      if (f) f(data, response);
    });
  }
  createInstance(id, f) {
    client.methods.createInstance({ data: { args: '', port: null }, path: { id: id }, headers: { 'Content-Type': 'application/json' }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      if (f) f(data, response);
    });
  }
  removeInstance(id, f) {
    client.methods.removeInstance({ path: { id: id }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      if (f) f(data, response);
    });
  }
  startInstance(id, f) {
    client.methods.startInstance({ path: { id: id }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(JSON.stringify(data));
      if (f) f(data, response);
    });
  }
  stopInstance(id, f) {
    client.methods.stopInstance({ path: { id: id }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      if (f) f(data, response);
    });
  }
  stopInstance(id, f) {
    client.methods.stopInstance({ path: { id: id }}, function(data, response) {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      if (f) f(data, response);
    });
  }
  synchronizeInstance(id, f) {
    client.methods.synchronizeInstance({ path: { id: id }}, function() {
      console.log(response.statusCode + ' ' + String(response.statusMessage));
      console.log(String(data));
      if (f) f(data, response);
    });
  }

}

module.exports = TreeClient;
