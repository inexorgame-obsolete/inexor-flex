/**
 * This module provides a connector to Inexor Core instances.
 * @module connector
 * @see grpc
 */

const EventEmitter = require('events');
const fs = require('fs');
const grpc = require('grpc');
const path = require('path');
const toml = require('toml');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

/**
 * Connects a {@link Root} with a Inexor Core instance
 */
class Connector extends EventEmitter {

  /**
   * @constructor
   * @param {tree.Node} instance_node - the instance node
   */
  constructor(applicationContext, instanceNode) {

    super();

    /// The application context
    this.applicationContext = applicationContext;
    
    /// The profile manager service
    this.profileManager = this.applicationContext.get('profileManager');

    /** @private */
    this.instanceNode = instanceNode;

    /** @private */
    // TODO: instanceNode.hostname
    this.hostname = 'localhost';

    /** @private */
    this.port = instanceNode.port;

    /** @private */
    this._client = null;

    /// Create a random session id
    this.sessionId = Math.random().toString(36).substr(2, 4);

    /// The log manager
    this.logManager = this.applicationContext.get('logManager');

    /// Create a child logger for the connector instance
    this.log = this.logManager.getLogger(this.getLoggerName());

    /// Start with the same log level as the parent logger
    this.log.level(this.logManager.getLogger('flex.instances.Connector').level());

    /** @private */
    this._protoPath = this.getProtoPath(instanceNode.type);
    this.log.info('Path to the .proto file: %s', this._protoPath);

    if (!fs.existsSync(this._protoPath)) {
      this.log.error('Proto file does not exist: ' + this._protoPath);
      throw new Error('Proto file does not exist: ' + this._protoPath);
    }

    /**
     * @property {Object} protoDescriptor
     */
    this.protoDescriptor = grpc.load(path.resolve(this._protoPath));

    this.nodeSyncListeners = [];
    this.synchronizeListeners = [];
  }

  /**
   * Returns the logger name for the connector instance. Uses the hostname,
   * port and session id as logger name.
   */
  getLoggerName() {
    return util.format('flex.instances.Connector.%s.%s.%s', this.hostname, this.port, this.sessionId);
  }

  onSynchronizeEnd() {
    this.log.info('Synchronize END');
  }

  onSynchronizeStatus(status) {
    if (status.code == 14) {
      this.log.error('Endpoint read failed');
      this.log.error(status);
      this.disconnect();
    } else {
      this.log.info('Synchronize STATUS\n' + JSON.stringify(status));
    }
  }

  onSynchronizeError(err) {
    this.log.error('Synchronize ERROR');
    this.log.error(err);
    // this.disconnect();
  }

  onSynchronizeData(message) {
    let protoKey = message.key;
    try {
      let value = message[protoKey];
      let path = this.getPath(protoKey);
      let eventType = this.getEventType(protoKey);
      var dataType = this.getDataType(protoKey);
      var id = this.getId(protoKey);
      switch (eventType) {
        case 'TYPE_GLOBAL_VAR_MODIFIED':
          this.log.trace(util.format('[%s] id: %d protoKey: %s path: %s dataType: %s', eventType, id, protoKey, path, dataType));
          let node = this.instanceNode.getRoot().findNode(path);
          // Set value, but prevent sync
          node.set(value, true);
          break;
        case 'TYPE_FUNCTION_EVENT':
          this.log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
          break;
        case 'TYPE_FUNCTION_PARAM':
          this.log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
          break;
        case 'TYPE_LIST_EVENT_ADDED':
          this.log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
          break;
        case 'TYPE_LIST_EVENT_MODIFIED':
          this.log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
          break;
        case 'TYPE_LIST_EVENT_REMOVED':
          this.log.warn(util.format('EventType %s currently not implemented (protoKey %s)', eventType, protoKey));
          break;
        default:
          this.log.warn(util.format('Unknown eventType %s (protoKey %s)', eventType, protoKey));
          break;
      }
    } catch (err) {
      this.log.error(err, util.format('Incoming synchronization of %s failed!', protoKey));
    }
  }

  /**
   * The tree node has been modified and shall be synchronized.
   */
  onTreeNodeSync(node, oldValue, newValue) {
    this.log.debug(util.format('Synchronizing node %s', node.getPath()));
    try {
      let message = this.getMessage(node);
      this.log.debug('Sending message: ' + JSON.stringify(message));
      this._synchronize.write(message);
    } catch (err) {
      this.log.error(err, util.format('Synchronization of %s failed', node._protoKey));
    }
  }

  /**
   * Returns a new message.
   * @function
   * @param <tree.Node> node - The tree node to be sent.
   */
  getMessage(node) {
    let message = {};
    message[node._protoKey] = node.get();
    return message;
  }

  /**
   * A new tree node has been created for the instance. We register a listener on
   * the sync event of the newly created tree node.
   * @function
   * @param <tree.Node> node - The tree node which has been created.
   */
  onNewTreeNode(node) {
    if (node.isChildOf(this.instanceNode)) {
      this.log.debug(util.format('Adding synchronization event of node %s', node.getPath()));
      // ... and add an sync event on the added tree node
      var self = this;
      let nodeSyncListener = (oldValue, newValue) => {
        self.onTreeNodeSync(node, oldValue, newValue)
      };
      this.nodeSyncListeners.push({
        node: node,
        listener: nodeSyncListener
      });
      node.on('sync', nodeSyncListener);
    }
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
      this.log.debug(util.format('Connecting to the gRPC server on %s:%d', this.hostname, this.port));

      // Create a GRPC client
      this._client = new this.protoDescriptor.inexor.tree.TreeService(
        util.format('%s:%d', this.hostname, this.port),
        grpc.credentials.createInsecure()
      );
      this.log.debug('Created a new GRPC client');

      // Get the ClientWritableStream
      // @see http://www.grpc.io/grpc/node/module-src_client-ClientWritableStream.html
      this._synchronize = this._client.synchronize();

      // Fetching stream data
      this.addSynchronizeListener('data', this.onSynchronizeData.bind(this));

      // The server has finished sending
      this.addSynchronizeListener('end', this.onSynchronizeEnd.bind(this));

      // We get a status message if the gRPC server disconnects
      this.addSynchronizeListener('status', this.onSynchronizeStatus.bind(this));

      // Handle synchronization errors
      this.addSynchronizeListener('error', this.onSynchronizeError.bind(this));

      // We listen on the ADD event of the root tree node ...
      this.instanceNode.getRoot().on('add', this.onNewTreeNode.bind(this));
      
      // TODO: on('connected')
      // see: https://github.com/grpc/grpc/issues/8117
      grpc.waitForClientReady(this._client, Infinity, (err) => {
        if (err != null) {
          self.log.error(err);
          reject('GRPC connection failed');
        } else {
          if (!self.instanceNode.hasChild('initialized') || (self.instanceNode.hasChild('initialized') && !self.instanceNode.initialized)) {

            // Populate tree from defaults
            self.populateInstanceTreeFromDefaults();

            // Populate tree with instance values
            self.loadInstanceConfiguration();

            // Link tree mounts (like textures)
            // TODO: Link tree mounts (like textures)

            // Set package dir
            self.instanceNode.package_dir = path.resolve(path.join(inexor_path.getMediaPaths()[0], 'core'));

            // Send signal that the tree initialization has been finished
            self.sendFinishedTreeIntro();
            
            self.instanceNode.addChild('initialized', 'bool', true);

            self.log.info('Tree for instance successfully initialized');
          } else {
            self.log.info('Using already initialized tree');
          }

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
    let instanceId = this.instanceNode.getName();
    this.removeListeners();
    this.closeGrpcConnection();
    this.emit('disconnected', {
      'instanceNode': this.instanceNode
    });
  }

  /**
   * Add a new listener for the GRPC synchronize service.
   */
  addSynchronizeListener(eventName, listener) {
    this._synchronize.on(eventName, listener);
    this.synchronizeListeners.push({
      eventName: eventName,
      listener: listener
    });
  }

  /**
   * Removes all listeners.
   */
  removeListeners() {
    this.removeTreeListeners();
    this.removeGrpcListeners();
  }

  /**
   * Removes all listeners for the inexor tree.
   */
  removeTreeListeners() {
    this.log.info('Removing listeners for the inexor tree');
    // No more adding tree nodes to this connector
    this.instanceNode.getRoot().removeListener('add', this.onNewTreeNode.bind(this));
    // No more syncing from this listener
    for (let i = 0; i < this.nodeSyncListeners.length; i++) {
      let nodeSyncListener = this.nodeSyncListeners[i];
      nodeSyncListener.node.removeListener('sync', nodeSyncListener.listener);
    }
  }

  /**
   * Remove all listeners for the GRPC synchronize service.
   */
  removeGrpcListeners() {
    this.log.info('Removing listeners for GRPC');
    for (let i = 0; i < this.synchronizeListeners.length; i++) {
      let synchronizeListener = this.synchronizeListeners[i];
      this._synchronize.removeListener(synchronizeListener.eventName, synchronizeListener.listener);
    }
  }

  /**
   * Closes the GRPC connection.
   */
  closeGrpcConnection() {
    this.log.info('Closing GRPC connection');
    try {
      grpc.closeClient(this._client);
    } catch (err) {
      this.log.error(err, 'Failed to close GRPC connection');
    }
  }

  /**
   * Populates the tree.
   * @function
   */
  populateInstanceTreeFromDefaults() {
    this.log.info('Populating tree');
    for (let protoKey in this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName) {
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
          this.log.debug('[SUCCESS] protoKey: ' + protoKey + ' path: ' + path + ' dataType: ' + dataType + ' defaultValue: ' + defaultValue + ' id: ' + id + ' eventType: ' + eventType);
        } else {
          this.log.debug('[SKIPPED] protoKey: ' + protoKey + ' path: ' + path + ' dataType: ' + dataType + ' defaultValue: ' + defaultValue + ' id: ' + id + ' eventType: ' + eventType);
        }
      } catch (err) {
        this.log.error(err, util.format('[ERROR] Failed to populate %s', protoKey));
      }
    }
    this.log.info('Tree populated');
  }

  /**
   * Load instance configuration.
   * @function
   */
  loadInstanceConfiguration() {
    let instanceId = this.instanceNode.getName();
    let filename = util.format('%s.toml', instanceId);
    let configPath = this.profileManager.getConfigPath(filename);
    if (fs.existsSync(configPath)) {
      this.log.info(util.format('Loading instance configuration from %s', configPath));
      let data = fs.readFileSync(configPath);
      let config = toml.parse(data.toString());
      let basePath = util.format('/instances/%s', instanceId);
      this.updateTree(config, basePath, configPath);
      this.log.info('Instance configuration done');
    } else {
      this.log.info(util.format('Could not find instance configuration (expected file location: %s)', configPath));
    }
  }

  /**
   * TODO: move this to the tree root. Could be useful for merging trees and for introducing GraphQL.
   */
  updateTree(obj, basePath, configPath = '') {
    for (let property in obj) {
      if (obj.hasOwnProperty(property)) {
        let path = util.format('%s/%s', basePath, property);
        // this.log.info(path);
        if (typeof obj[property] == 'object') {
          this.updateTree(obj[property], path, configPath);
        } else {
          // this.log.info(util.format('set node: %s', obj[property]));
          let node = this.instanceNode.getRoot().findNode(path);
          if (node != null) {
            let value = this.convert(node._datatype, obj[property]);
            // this.log.info(util.format('path: %s protoKey: %s datatype: %s value: %s', node.getPath(), node._protoKey, node._datatype, value));
            node.set(value);
          } else {
            this.log.warn(util.format('Node %s does not exist! Please fix this value in %s', path, configPath));
          }
        }
      }
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

  /**
   * Sends an event to Inexor Core which signals that the tree initialization
   * has been finished.
   *
   * @function
   */
  sendFinishedTreeIntro() {
    try {
      this.log.debug('Sending FinishedTreeIntroSignal...');
      this._synchronize.write({ 'general_event': 1 });
      this.log.info('Successfully sent finished tree intro signal');
    } catch (err) {
      this.log.error(err, 'Failed to send FinishedTreeIntroSignal!');
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
    var subPath = this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName[protoKey].options['(path)'];
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
    return this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName[protoKey].type.name;
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
      var defaultValueAsString = this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName[protoKey].options['(default_value)'];
      switch (dataType) {
        case 'int32':
        case 'int64':
          return parseInt(defaultValueAsString);
        case 'float':
          return parseFloat(defaultValueAsString);
        case 'bool':
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
    return this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName[protoKey].id;
  }

  /**
   * Returns the event type of the field by proto key.
   *
   * @function
   * @param {string} protoKey The proto key.
   * @return {string}
   */
  getEventType(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeEvent.$type._fieldsByName[protoKey].options['(event_type)'];
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
