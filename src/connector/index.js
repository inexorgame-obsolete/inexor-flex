/**
 * @module connector
 * @see grpc
 */

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const grpc = require('grpc');
const tree = require('@inexor-game/tree');

/** @private */
const protoPath = path.dirname(require.main.filename) + '/core/bin/inexor.proto'

/**
 * Connects a {@link tree.Root} with a Inexor Core instance
 */
class Connector extends EventEmitter {
  /**
   * @constructor
   * @param {number} port - the port of Inexor Core
   * @param {tree.Root} root - the tree to synchronize with
   */
  constructor(port, root) {
    /**
     * @property {Object} protoDescriptor
     */
    this.protoDescriptor = grpc.load(protoPath);
    /** @private */
    this._root = root;
    this._port = port;
  }

  /**
   * Returns the path of the field by proto key.
   * @function
   * @param {string} protoKey
   * @return {string}
   */
  getPath(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(path)'];
  }

  /**
   * Returns the datatype of the field by proto key.
   * @function
   * @param {string} protoKey
   * @return {tree.datatype}
   */
  getDataType(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].type.name;
  }

  /**
   * Returns the id of the field by proto key.
   * @function
   * @param {string} protoKey
   * @return {number}
   */
  getId() {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].id;
  }

  /**
   * @function
   * @fires Connector.connected
   */
  connect() {
    // Connect to the gRPC client
    this.treeServiceClient = new this.protoDescriptor.inexor.tree.TreeService('localhost:' + this._port, grpc.credentials.createInsecure());

    this.synchronize = this.treeServiceClient.synchronize();
    this.synchronize.on('data', (message) => {
      try {
        let protoKey = message.key;
        let value = message[protoKey];
        let path = this.getPath(protoKey);

        if (protoKey != '__numargs') {
          throw new Error('${protoKey} does not have enough arguments.')
        }
        let node = this._tree.findNode(path);

        node.set(value, true); // Prevent sync
      } catch (err) {
        throw new Error('Synchronization of ${protoKey} has failed because of ${err}.')
      }
    });

    this.synchronize.on('end', function() {
        // The server has finished sending
        throw new Error('Synchronization has end.')
    });

    this.synchronize.on('status', function(status) {
        throw new Exception('Status ${status} has been received.') // Usually we don't send status information, might change
    });

    this.synchronize.on('error', function(err) {
        throw new Error('${err} has occured.')
    });

    // this.initializeTree(); @deprecated
    this.emit('connected');
  }

  /**
   * Initializes a tree from a running Inexor Core
   * @private
   * @deprecated
   */
  _initialize() {
    for (let protoKey in this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName) {
          try {
              this._root.createRecursive(this.getPath(protoKey), this.getDataType(protoKey), false, true, false);
          } catch (err) {
              throw(err);
          }
    }
  }
}

module.exports = Connector
