const util = require('util');

const syncStates = {
  get: 'get',
  set: 'set',
  sync: 'sync',
  add: 'add',
  error: 'error'
};

/**
 * Websockets API for managing tree nodes of the Inexor Tree.
 * @module api
 */
class InexorTreeWsAPI {

  /**
   * Constructs the Inexor Tree REST API.
   */
  constructor(applicationContext) {

    // The express router and app
    this.app = applicationContext.get('app');
    this.router = applicationContext.get('router');

    // The express websockets handler
    this.websockets = applicationContext.get('websockets');

    // The Inexor Tree
    this.root = applicationContext.get('tree');

    // The tree node which contains all instance nodes
    this.instancesNode = this.root.getOrCreateNode('instances');

    // Returns the value of the tree node.
    this.app.ws('/ws/tree', this.handleRequest.bind(this));

    // The web socket server
    this.wss = this.websockets.getWss('/ws/tree');

    // Listen on the root node if any node has changed
    this.root.on('postSet', this.syncNode.bind(this));

    // Listen on the root node if any node has changed
    this.root.on('add', this.addNode.bind(this));

  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.server.api.v1.ws.InexorTreeWsAPI');
    
  }

  /**
   * Get or set node values.
   */
  handleRequest(ws, req) {
    ws.on('message', (message) => {
      try {
        let request = JSON.parse(message);
        let node = this.root.findNode(request.path);
        if (node != null) {
          if (node.isContainer) {
            ws.send(this.getMessage(syncStates.get, node));
          } else {
            if (req.hasOwnProperty('value')) {
              let value = this.convert(node._datatype, request.value);
              if (value != null) {
                node.set(value);
              }
            }
            ws.send(this.getMessage(syncStates.set, node));
          }
        } else {
          ws.send(JSON.stringify({
            state: syncStates.error,
            path: request.path,
            message: 'Not found'
          }));
        }
      } catch (err) {
        this.log.error(err, util.format('Failed to process message: %s\n%s', err.message, message));
      }
    });
  }

  /**
   * Send tree node sync events to the web socket clients.
   */
  syncNode({node: node}) {
    try {
      this.wss.clients.forEach((client) => {
        client.send(this.getMessage(syncStates.sync, node));
      });
    } catch (err) {
      this.log.error(err, util.format('Failed to send tree node sync event for %s: %s', node.getPath(), err.message));
    }
  }

  /**
   * Send tree node add events to the web socket clients.
   */
  addNode(node) {
    try {
      this.wss.clients.forEach((client) => {
        client.send(this.getMessage(syncStates.add, node));
      });
    } catch (err) {
      this.log.error(err, util.format('Failed to send tree node add event for %s: %s', node.getPath(), err.message));
    }
  }
  
  getMessage(state, node) {
    return JSON.stringify({
      state: state,
      datatype: node._datatype,
      path: node.getPath(),
      value: node.isContainer ? node.getChildNames : node.get()
    });
  }

  /**
   * Converts an incoming string value to the target datatype.
   * TODO: move to tree utils
   */
  convert(datatype, value) {
    if (typeof value == 'string') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
          return parseInt(value);
        case 'float':
          return parseFloat(value);
        case 'bool':
          return (value == 'true');
        case 'string':
          return value;
        default:
          // timestamp, object, node,
          return null;
      }
    } else if (typeof value == 'number') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
        case 'float':
          return value;
        case 'bool':
          return value == 1 ? true : false;
        case 'string':
          return value.toString();
        default:
          // timestamp, object, node,
          return null;
      }
    } else if (typeof value == 'boolean') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
        case 'float':
          return value ? 1 : 0;
        case 'bool':
          return value;
        case 'string':
          return value.toString();
        default:
          // timestamp, object, node,
          return null;
      }
    } else {
      return null;
    }
  }

}

module.exports = InexorTreeWsAPI;
