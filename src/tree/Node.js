const EventEmitter = require('events');
const util = require('./util')

/**
 * Represents a tree Node
 * @todo Add a verbose logging system (shouldn't be difficult though)
 */
class Node extends EventEmitter {
    /**
     * @constructor
     * @param {(Node|null)} - the parent node
     * @param {string} name - Must not contain whitespace or dots
     * @param {datatype} type - the data type to be used
     * @param {mixed} initValue
     * @param {boolean} sync
     * @param {boolean} readOnly
     */
    constructor(parent, name, datatype, initialValue = null, sync = false, readOnly = false) {
        // parent constructor
        super();

        /**
         * @private
         * @property {Node} parent
         */
        this._parent = parent;

        /**
         * @private
         * @property {string} _name
         */
        this._name = name;

        /**
         * @private
         * @property {string} _path
         */

        // The path of the tree (unique)
        if (parent != null) {
            if (parent._path != util.separator) {
                this._path = parent._path + util.separator + name;
            } else {
                this._path = util.separator + name;
            }
        } else {
            this._path = util.separator;
        }

        /**
         * @private
         * @property {datatype} _datatype
         */

        // The data type of the Node
        if (util.isValidDataType(datatype)) {
            this._datatype = datatype;
        } else {
            throw new Error('Invalid data type');
        }

        /**
         * @private
         * @property {boolean} _readOnly
         *
         * @todo this could be done using prototype defines
         */
        this._readOnly = readOnly;

        /**
         * Is a node a container (does it contain children)?
         * @property {boolean} isContainer
         */

        /**
         * Is the node a data leaf?
         * @property {boolean} isLeaf - is the node a data leaf?
         */

        /**
         * @private
         * @property {mixed} _value
         */

        /**
         * @private
         * @property {Date} _timespamp
         */

        /**
         * @private
         * @property {boolean} _sync
         */

        // Check the node type (either node or a data item)
        if (datatype == 'node') {
            this.isContainer = true;
            this.isLeaf = false;
            // Initializes the map of child nodes.

            this._value = new Map();
        } else {
            this.isContainer = false;
            this.isLeaf = true;

            // Sets the initial value.
            if (initialValue != null) {
                this._value = initialValue;
            } else {
                throw new Error('No initial value provided');
            }

            if (datatype == 'flex') {
              this._sync = false; // Never enable sync for flex types
            } else {
              // Sets if the tree node should be synchronized.
              this._sync = sync;
            }
        }
    }

    /**
     * Returns the path of the tree node.
     * @function
     * @name Node.getPath
     * @return {string}
     */
    getPath() {
        return this._path;
    }

    /**
     * Returns either the value or child nodes of the current node
     * @function
     * @name Node.get
     * @return {mixed|Node[]}
     */
    get() {
        return this._value;
    }

    /**
     * Set the value of the tree node
     * @function
     * @name Node.set
     * @param {mixed} value
     * @param {boolean} preventSync - whether the value should be synchronized or not
     * @fires Node.preSet
     * @fires Node.postSet
     * @fires Node.sync
     */
    set(value, preventSync = false) {
        if (this.isLeaf && !this._readOnly) {
            let oldValue = this._value;
            this.emit('preSet', {oldValue: oldValue, newValue: value});
            // Update the value
            this._value = value;

            // Emit sync to be synchronized by the connector.
            if (this._sync && !preventSync) {
                this.emit('sync', value);
            }

            // Set the timestamp when the value was last changed
            this._timestamp = Date.now();
            this.emit('postSet', {oldValue: oldValue, newValue: value});
        }
    }

    /**
     * Checks whether the node has specified child or not
     * @function
     * @name Node.hasChild
     * @param {string} name
     * @return {boolean}
     */
    hasChild(name) {
        return this.isContainer && this._value.has(name);
    }

    /**
     * Returns the root node (from parent)
     * @function
     * @name Node.getRoot
     * @return {Root}
     */
    getRoot() {
        let root = this._parent;
        while (root._path != util.separator) {
            node = node._parent;
        }

        return root;
    }

    /**
     * Returns the child with the given name.
     * @function
     * @name Node.getChild
     * @param {string} name
     * @return {Node}
     */
    getChild(name) {
        if (this.hasChild(name)) {
        	  return this._value.get(name);
        } else {
        	  return null;
        }
    }

    /**
     * Returns the child names
     * @function
     * @name Node.getChildNames
     * @return {Array<string>}
     */
    getChildNames() {
        let keys = (this.isContainer) ? new Array().from(this._value.keys()) : [];
        return keys;
    }

    /**
     * Adds a child to the node
     * @function
     * @name Node.addChild
     * @param {string} name
     * @param {tree.datatype} datatype
     * @param {mixed} initialValue
     * @param {boolean} sync
     * @param {boolean} readOnly
     * @return {Node}
     * @see Node.constructor
     * @fires Node.add
     */
    addChild(name, datatype, initialValue = null, sync = false, readOnly = false) {
        if (this.hasChild(name)) {
            return this.getChild(name);
        } else if (name.indexOf('/') == 0) {
            // This is NOT the root leave, don't insert it like this
            throw new Error('Child nodes shall not be prefixed with /');
        } else if (this.isContainer && util.validName.test.bind(name) && util.isValidDataType(datatype)) {
            // Create the child tree node
            let childNode = new Node(this, name, datatype, initialValue, sync, readOnly);
            // Add the child tree node to the children map
            this._value.set(name, childNode);

            let self = this;
            Object.defineProperty(self, name, {
                get() {
                    return (childNode.isContainer) ? childNode : childNode.get();
                },
                set(value) {
                    childNode.set(value);
                }
            });

            this.emit('add', childNode); // Used for subscribing
            return childNode;
        } else {
        	  var reason = "";
        	  if (this.hasChild(name)) {
        	  	reason = "Child " + name + "already exists";
        	  } else if (!this.isContainer) {
        	  	reason = "Parent node must be a container node: isContainer=" + String(this.isContainter);
        	  } else if (!util.validName.test.bind(name)) {
        	  	reason = "Not a valid name:" + name;
        	  } else if (!util.isValidDataType(datatype)) {
        	  	reason = "Not a valid data type: " + datatype;
        	  }
            throw new Error('Failed to create child node: ' + reason);
        }
    }

    /**
     * @function
     * @property {string} name
     * @name Node.addNode
     * @alias Node.addChild
     */
    addNode(name) {
        return this.addChild(name, 'node');
    }

    /**
     * Removes a child by name
     * @function
     * @name Node.removeChild
     * @param {string} name
     */
    removeChild(name) {
        if (this.hasChild(name) && !this.getChild(name)._readOnly) {
            this._value.delete(name);
        }
    }

    /**
     * Returns the parent node or null if the tree node is the root node
     * @function
     * @name Node.getParent
     * @return {Node|null}
     */
    getParent() {
        return (this._path != util.separator) ? this._parent : null;
    }

    /**
     * Returns a JSON representation of the node
     * @function
     * @name Node.toString
     * @return {string}
     */
    toString() {
        if (this.isContainer) {
            let entries = {};
            for (var [name, childNode] of this._value.entries()) {
                entries[name] = childNode.toString();
            }
            return JSON.stringify(entries);
        } else {
            return JSON.stringify(this._value);
        }
    }

    /**
     * Iterates over the node and child nodes
     * @function
     * @return {Node}
     */
    [Symbol.iterator]() {
      let done = false;
      let root = this;
      let previous = null;
      let current = root;

      return {
        next: function() {
          if (current.hasChild()) {
            /*previous = current;
            let childName = previous.getChildNames([0]);
            current = previous.getChild(childName);
            previous.removeChild(childName);
            return {value: current, done: done};*/
          } else if (current == root && !done) {
            done = true; // After this iteration the root is reached
            return {value: current, done: false}
          } else {
            return {done: done};
          }
        }
      }
    }
}

module.exports = Node;
