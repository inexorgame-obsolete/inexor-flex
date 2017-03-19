/**
 * @module connector
 * @see grpc
 */

const path = require('path');
const EventEmitter = require('events');
const grpc = require('grpc');
const util = require('util');
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');
const log = require('@inexor-game/logger')();

const debuglog = util.debuglog('connector');

/** @private */
// const protoPath = path.dirname(require.main.filename) +
// '/core/bin/inexor.proto'

/**
 * Connects a {@link Root} with a Inexor Core instance
 */
class Connector extends EventEmitter {

  /**
   * @constructor
   * @param {number}
   *          port - the port of Inexor Core
   * @param {Root}
   *          root - the tree to synchronize with
   */
  constructor(instance_node) {

    super();

    /** @private */
    this._instance_node = instance_node;

    /** @private */
    this._port = instance_node.port;

    /** @private */
    this._client = null;
    
    /** @private */
    // TODO: we need distinguish between server and client, therefore we need
    // two .proto files: inexor-core-client.proto and inexor-core-server.proto
    this._protoPath = path.join(inexor_path.getBinaryPath(), 'RPCTreeData-inexor.proto');
    log.info('Path to the .proto file: %s', this._protoPath);
    
    /**
     * @property {Object} protoDescriptor
     */
    this.protoDescriptor = grpc.load(path.resolve(this._protoPath));

  }

  /**
   * Connecting to the gRPC server of Inexor Core.
   * @function
   * @fires Connector.connected
   */
  connect() {
    log.info('Connecting to the gRPC server on localhost:' + this._port);
    
    // Create a GRPC client
    this._client = new this.protoDescriptor.inexor.tree.TreeService(
      'localhost:' + this._port,
      grpc.credentials.createInsecure()
    );

    // Get the ClientWritableStream
    // @see http://www.grpc.io/grpc/node/module-src_client-ClientWritableStream.html
    this._synchronize = this._client.synchronize();

    // Fetching stream data
    this._synchronize.on('data', (message) => {
      try {

        log.info('Getting stream data: ' + JSON.stringify(message));

        // let event_type = message.event_type
        let protoKey = message.key;
        let value = message[protoKey];
        let path = this.getPath(protoKey);
        let eventType = this.getEventType(protoKey);
        
        if (eventType == 'TYPE_GLOBAL_VAR_MODIFIED') {
          log.info('[DATA] id: ' + id + ' protoKey: ' + protoKey + ' path: ' + path + ' dataType: ' + dataType + ' eventType: ' + eventType);
          
        } else {
          // TODO: handle other event types like SharedLists and SharedFunctions
        }

        if (protoKey != '__numargs') {
          // throw new Error('${protoKey} does not have enough arguments.')
          debuglog('protoKey = "' + protoKey + '" path = "' + path + '" value = "' + value + '"');
        }
        // let node = this._tree.findNode(path);
        let node = this._instance_node.getRoot().findNode(path);

        // Prevent sync
        node.set(value, true);

      } catch (err) {
        throw new Error('Synchronization of ${protoKey} has failed because of ${err}.')
      }
    });

    // The server has finished sending
    this._synchronize.on('end', function() {
      try {
        log.info('Synchronize END');
      } catch (err) {
        throw new Error('Synchronization has end.')
      }
    });

    // We get a status message if the gRPC server disconnects
    this._synchronize.on('status', function(status) {
      try {
        log.info('Synchronize STATUS\n' + JSON.stringify(status));
      } catch (err) {
        debuglog(err);
      }
    });

    this._synchronize.on('error', function(err) {
      try {
        log.error('Synchronize ERROR\n%s', err);
      } catch (err) {
        debuglog(err);
      }
    });

    var self = this;
    this._instance_node.getRoot().on('add', function(node) {
      if (node.isChildOf(self._instance_node)) {
        log.info('Adding synchronization event of node ' + node.getPath());
        node.on('sync', function(oldValue, newValue) {
          log.info('Synchronizing node ' + node.getPath());
          try {
            let message = {};
            message[node._protoKey] = node.get();
            log.info('Sending message: ' + JSON.stringify(message));
            self._synchronize.write(message);
          } catch (err) {
            log.error(err, 'Synchronization of ' + self.getProtoKey(node._path) + ' failed');
            // throw new Error('Synchronization of ' + this.getProtoKey(node._path) + ' failed');
          }
        });
      }
    });

    var self = this;
    setTimeout(function() {

      // Populate tree from defaults
      self.populateInstanceTreeFromDefaults();

      // Populate tree with instance values
      // TODO: Populate tree with instance values

      // Link tree mounts (like textures)
      // TODO: Link tree mounts (like textures)

      // Send signal that the tree initialization has been finished
      self.sendFinishedTreeIntro();

      self._synchronize.end();

      // @deprecated
      // this.initializeTree();

      // Finally send an event, that the connection has been established
      // successfully.
      self.emit('connected', {
        instance_node: self._instance_node
      });

    }, 2000);

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
          this._instance_node.getRoot().createRecursive(path, dataType, defaultValue, true, false, protoKey);
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
    log.info('Sending finished tree intro signal');
    try {
      var message = {
        'general_event': 1
      };
      log.info('Sending message: ' + JSON.stringify(message));
      this._synchronize.write(message);
    } catch (err) {
      debuglog(err);
      // throw new Error('Synchronization of ' + this.getProtoKey(node._path) + ' failed');
    }
    log.info('Finished tree intro signal sent.');
  }

  /**
   * Returns the path of the field by proto key. The path is prefixed with the
   * path of instance node.
   * 
   * @function
   * @param {string}
   *          protoKey
   * @return {string}
   */
  getPath(protoKey) {
    var subPath = this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(path)'];
    if (typeof subPath != 'undefined') {
      // Prefix with the path of the instance node
      return this._instance_node.getPath() + subPath;
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
   * @param {string}
   *          protoKey
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
   * @param {string}
   *          protoKey
   * @return {number}
   */
  getId(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].id;
  }

  /**
   * Returns the event type of the field by proto key.
   * 
   * @function
   * @param {string}
   *          protoKey
   * @return {string}
   */
  getEventType(protoKey) {
    return this.protoDescriptor.inexor.tree.TreeService.service.children[0].resolvedRequestType._fieldsByName[protoKey].options['(event_type)'];
  }

}

module.exports = Connector
