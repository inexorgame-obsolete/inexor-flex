const express_ws = require('express-ws');
const util = require('util');

/**
 * Websockets API for managing tree nodes of the Inexor Tree.
 */
class InexorTreeWsAPI {

  /**
   * Constructs the Inexor Tree REST API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The express websockets handler
    this.websockets = applicationContext.get('websockets');

    // The Inexor Tree
    this.root = applicationContext.get('tree');

    // The tree node which contains all instance nodes
    this.instancesNode = this.root.getOrCreateNode('instances');

    // Returns the value of the tree node.
    this.router.ws('/ws/tree', this.handleRequest.bind(this));

    // The web socket server
    this.wss = this.websockets.getWss('/ws/tree');

    // Listen on the root node if any node has changed
    this.root.on('set', this.sync.bind(this));
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
    let node = this.root.findNode(req.path);
    if (node != null) {
      if (node.isContainer) {
        ws.send({
          datatype: node._datatype,
          path: node.getPath(),
          childs: node.getChildNames(),
        });
      } else {
        if (req.hasOwnProperty('value')) {
          let value = this.convert(node._datatype, req.value);
          if (value != null) {
            node.set(value);
          }
        }
        ws.send(JSON.stringify({
          datatype: node._datatype,
          path: node.getPath(),
          value: node.get()
        }));
      }
    } else {
      ws.send(JSON.stringify({
        datatype: null
      }));
    }
  }

  /**
   * Push changes to the clients
   */
  sync({node: node}) {
    try {
      this.wss.clients.forEach(function (client) {
        client.send(JSON.stringify({
          datatype: node._datatype,
          path: node.getPath(),
          value: node.get()
        }));
      });
    } catch (err) {
      this.log.error(err, util.format('Failed to sync tree node %s: %s', node.getPath(), err.message));
    }
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
