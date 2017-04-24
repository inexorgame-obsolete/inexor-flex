/**
 * This module provides a connector to Inexor Core instances.
 * @module connector
 * @see grpc
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const grpc = require('grpc');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_log = require('@inexor-game/logger');
const inexor_path = require('@inexor-game/path');

const debuglog = util.debuglog('connector');
const log = inexor_log('@inexor-game/flex/Connector');

/**
 * Connects a {@link Root} with a Inexor Core instance
 */
class Connector extends EventEmitter {

  /**
   * @constructor
   * @param {tree.Node} instance_node - the instance node
   */
  constructor(instanceNode) {

    super();

    /** @private */
    this.instanceNode = instanceNode;

    /** @private */
    // TODO: instanceNode.hostname
    this.hostname = 'localhost';

    /** @private */
    this.port = instanceNode.port;

    /** @private */
    this._client = null;

    /** @private */
    this._protoPath = this.getProtoPath(instanceNode.type);
    log.info('Path to the .proto file: %s', this._protoPath);

    if (!fs.existsSync(this._protoPath)) {
      log.error('Proto file does not exist: ' + this._protoPath);
      throw new Error('Proto file does not exist: ' + this._protoPath);
    }

    /**
     * @property {Object} protoDescriptor
     */
    this.protoDescriptor = grpc.load(path.resolve(this._protoPath));

  }

  /**
   * Connecting to the gRPC server of Inexor Core.
   * @function
   * @fires Connector.connected
   * @return {Promise<tree.Node>}
   */
  connect() {
    var self = this;
    return new Promise((resolve, reject) => {
      log.info(util.format('Connecting to the gRPC server on %s:%d', this.hostname, this.port));

      // Create a GRPC client
      this._client = new this.protoDescriptor.inexor.tree.TreeService(
        this.hostname + ':' + this.port,
        grpc.credentials.createInsecure()
      );

      // Get the ClientWritableStream
      // @see http://www.grpc.io/grpc/node/module-src_client-ClientWritableStream.html
      this._synchronize = this._client.synchronize();

      // Fetching stream data
      this._synchronize.on('data', (message) => {
        let protoKey = message.key;
        try {
          let value = message[protoKey];
          let path = this.getPath(protoKey);
          let eventType = this.getEventType(protoKey);
          var dataType = this.getDataType(protoKey);
          var id = this.getId(protoKey);
          switch (eventType) {
            case 'TYPE_GLOBAL_VAR_MODIFIED':
              log.info(util.format('[%s] id: %d protoKey: %s path: %s dataType: %s', eventType, id, protoKey, path, dataType));
              let node = this.instanceNode.getRoot().findNode(path);
              // Set value, but prevent sync
              node.set(value, true);
              break;
            case 'TYPE_FUNCTION_EVENT':
              log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
              break;
            case 'TYPE_FUNCTION_PARAM':
              log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
              break;
            case 'TYPE_LIST_EVENT_ADDED':
              log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
              break;
            case 'TYPE_LIST_EVENT_MODIFIED':
              log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
              break;
            case 'TYPE_LIST_EVENT_REMOVED':
              log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
              break;
            default:
              log.warn(util.format('Unknown eventType %s (protoKey %s)', eventType, protoKey));
              break;
          }
        } catch (err) {
          log.error(err, util.format('Incoming synchronization of %s failed!', protoKey));
        }
      });

      // The server has finished sending
      this._synchronize.on('end', function() {
        log.info('Synchronize END');
      });

      // We get a status message if the gRPC server disconnects
      this._synchronize.on('status', function(status) {
        if (status.code == 14) {
          log.info('Endpoint read failed');
          self.disconnect();
        } else {
          log.info('Synchronize STATUS\n' + JSON.stringify(status));
        }
      });

      this._synchronize.on('error', function(err) {
        log.error('Synchronize ERROR\n%s', JSON.stringify(err));
        self.disconnect();
      });

      this.instanceNode.getRoot().on('add', function(node) {
        if (node.isChildOf(self.instanceNode)) {
          log.debug('Adding synchronization event of node ' + node.getPath());
          let handler = node.on('sync', function(oldValue, newValue) {
            log.debug('Synchronizing node ' + node.getPath());
            try {
              let message = {};
              message[node._protoKey] = node.get();
              log.info('Sending message: ' + JSON.stringify(message));
              self._synchronize.write(message);
            } catch (err) {
              log.error(err, 'Synchronization of ' + self.getProtoKey(node._path) + ' failed');
            }
          });
        }
      });

      // TODO: on('connected')
      // see: https://github.com/grpc/grpc/issues/8117
      grpc.waitForClientReady(this._client, Infinity, (err) => {
        if (err != null) {
          reject('GRPC connection failed');
        } else {
          // Populate tree from defaults
          self.populateInstanceTreeFromDefaults();

          // Set package dir
          self.instanceNode.package_dir = inexor_path.media_path;

          // Populate tree with instance values
          // TODO: Populate tree with instance values

          // Link tree mounts (like textures)
          // TODO: Link tree mounts (like textures)

          // Send signal that the tree initialization has been finished
          self.sendFinishedTreeIntro();

          // self._synchronize.end();

          // Finally send an event, that the connection has been established
          // successfully.
          self.emit('connected', {
            'instanceNode': self.instanceNode
          });

          resolve(self.instanceNode);
        }
      });

    });
  }

  disconnect() {
    let instance_id = this.instanceNode.name;
    log.info('Disconnecting ' + instance_id);
    this.emit('disconnected', {
      'instanceNode': this.instanceNode
    });
  }

  /**
   * Populates the tree.
   * @function
   */
  populateInstanceTreeFromDefaults() {
    log.info('Populating tree');
    for (let protoKey in this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName) {
      try {
        var path = this.getPath(protoKey);
        var dataType = this.getDataType(protoKey);
        var defaultValue = this.getDefaultValue(protoKey, dataType);
        var id = this.getId(protoKey);
        var eventType = this.getEventType(protoKey);
        if (eventType == 'TYPE_GLOBAL_VAR_MODIFIED') {
          // synchronize = true
          // readOnly = false
          // TODO: Add option "read_only" in proto file!
          this.instanceNode.getRoot().createRecursive(path, dataType, defaultValue, true, false, protoKey);
          debuglog('[SUCCESS] protoKey: ' + protoKey + ' path: ' + path + ' dataType: ' + dataType + ' defaultValue: ' + defaultValue + ' id: ' + id + ' eventType: ' + eventType);
        } else {
          debuglog('[SKIPPED] protoKey: ' + protoKey + ' path: ' + path + ' dataType: ' + dataType + ' defaultValue: ' + defaultValue + ' id: ' + id + ' eventType: ' + eventType);
        }
      } catch (err) {
        debuglog(err, '[ERROR] protoKey: ' + protoKey);
      }
    }
    log.info('Tree populated');
  }

  /**
   * Sends an event to Inexor Core which signals that the tree initialization
   * has been finished.
   *
   * @function
   */
  sendFinishedTreeIntro() {
    try {
      log.debug('Sending FinishedTreeIntroSignal...');
      this._synchronize.write({ 'general_event': 1 });
      log.info('Successfully sent finished tree intro signal');
    } catch (err) {
      log.error(err, 'Failed to send FinishedTreeIntroSignal!');
    }
  }

  /**
   * Returns the path of the field by proto key. The path is prefixed with the
   * path of instance node.
   *
   * @function
   * @param {string} protoKey The proto key.
   * @return {string} The path to the node.
   */
  getPath(protoKey) {
    var subPath = this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(path)'];
    if (typeof subPath != 'undefined') {
      // Prefix with the path of the instance node
      return this.instanceNode.getPath() + subPath;
    } else {
      return '';
    }
  }

  /**
   * Returns the datatype of the field by proto key.
   *
   * @function
   * @param {string}
   *          protoKey
   * @return {datatype}
   */
  getDataType(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].type.name;
  }

  /**
   * Returns the default value of the field by proto key.
   *
   * @function
   * @param {string} protoKey The proto key.
   * @return {string}
   */
  getDefaultValue(protoKey, dataType = null) {
    if (typeof dataType != 'undefined') {
      if (dataType == null) {
        dataType = this.getDataType(protoKey);
      }
      var defaultValueAsString = this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(default_value)'];
      switch (dataType) {
        case 'int32':
        case 'int64':
          return parseInt(defaultValueAsString);
        case 'float':
          return parseFloat(defaultValueAsString);
        case 'string':
        default:
          return defaultValueAsString;
      }
    } else {
      return null;
    }
  }

  /**
   * Returns the id of the field by proto key.
   *
   * @function
   * @param {string} protoKey The proto key.
   * @return {number}
   */
  getId(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].id;
  }

  /**
   * Returns the event type of the field by proto key.
   *
   * @function
   * @param {string} protoKey The proto key.
   * @return {string}
   */
  getEventType(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(event_type)'];
  }

  /**
   * Returns the path to the proto file by instance type.
   * @function
   * @name Connector.getProtoPath
   * @param {string} instanceType - The instance type - either client or server.
   * @return {string} the path to the proto file.
   */
  getProtoPath(instanceType) {
    switch (instanceType) {
      case 'client':
      default:
        return path.join(inexor_path.getBinaryPath(), 'RPCTreeData-inexor.proto');
      case 'server':
        return path.join(inexor_path.getBinaryPath(), 'RPCTreeData-server.proto');
    }
  }

}

module.exports = Connector
