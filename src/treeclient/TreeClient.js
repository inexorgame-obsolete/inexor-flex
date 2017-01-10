const rest_client = require('node-rest-client');

/**
 * The client to local or remote Inexor Trees via a REST API.
 */
class TreeClient {

  constructor(hostname, port) {
    this.hostname = hostname || 'localhost';
    this.port = port || 31416;
    this.base_url = 'http://' + hostname + ':' + port;
    this.rest_client = new rest_client.Client();
    this.rest_client.registerMethod('getAllInstances', base_url + '/instances', 'GET');
    this.rest_client.registerMethod('getInstance', base_url + '/instances/${id}', 'GET');
    this.rest_client.registerMethod('createInstance', base_url + '/instances/${id}', 'POST');
    this.rest_client.registerMethod('removeInstance', base_url + '/instances/${id}', 'DELETE');
    this.rest_client.registerMethod('startInstance', base_url + '/instances/${id}/start', 'GET');
    this.rest_client.registerMethod('stopInstance', base_url + '/instances/${id}/stop', 'GET');
    this.rest_client.registerMethod('connectInstance', base_url + '/instances/${id}/connect', 'GET');
    this.rest_client.registerMethod('synchronizeInstance', base_url + '/instances/${id}/synchronize', 'GET');
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
    client.methods.getInstances(function(data) { f(data); });
  }
  getInstance(id, f) {
    client.methods.getInstance({id:id}, function(data) { f(data); });
  }
  createInstance(id, f) {
    client.methods.createInstance({id:id}, function(data) { f(data); });
  }
  removeInstance(id, f) {
    client.methods.removeInstance({id:id}, function(data) { f(data); });
  }
  startInstance(id, f) {
    client.methods.startInstance({id:id}, function(data) { f(data); });
  }
  stopInstance(id, f) {
    client.methods.stopInstance({id:id}, function(data) { f(data); });
  }
  stopInstance(id, f) {
    client.methods.stopInstance({id:id}, function(data) { f(data); });
  }
  synchronizeInstance(id, f) {
    client.methods.synchronizeInstance({id:id}, function(data) { f(data); });
  }

}

module.exports = TreeClient;
