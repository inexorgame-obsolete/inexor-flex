const EventEmitter = require('events');
const JSON = require('circular-json');
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
    constructor(parent, name, datatype, initialValue = null, sync = false, readOnly = false, protoKey = null) {
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
         * @property {string} _protoKey
         */
        this._protoKey = protoKey;

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
            switch (datatype) {
              case 'int32':
              case 'int64':
              case 'enum':
                this._datatype = 'int64';
                break;
              default:
                this._datatype = datatype;
                break;
            }
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

            // Sets if the tree node should be synchronized.
            this._sync = sync;
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
                // this.emit('sync', value);
                this.emit('sync', {oldValue: oldValue, newValue: value});
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
     * Checks whether the node has children
     * @name Node.hasChildren
     * @return {boolean}
     */
    hasChildren() {
      return !this.isContainer || !(this._value.size == 0);
    }

    /**
     * Returns true, if the node is a child node (recursive) of other_node.
     * @name Node.isChildOf
     * @return {boolean}
     */
    isChildOf(other_node) {
      if (other_node) {
        let parent = this._parent;
        while (parent._path != util.separator) {
          if (parent._path == other_node._path) {
            return true;
          }
          parent = parent._parent;
        }
      }
      return false;
    }

    /**
     * Returns the root node (from parent)
     * @function
     * @name Node.getRoot
     * @return {Root}
     */
    getRoot() {
      if (this._path == util.separator) {
        return this;
      } else {
        let root = this._parent;
        while (root._path != util.separator) {
          root = root._parent;
        }
        return root;
      }
    }

    /**
     * Returns the child with the given name.
     * @function
     * @name Node.getChild
     * @param {string} name
     * @return {Node|null}
     */
    getChild(name) {
        if (this.hasChild(name)) {
        	  return this._value.get(name);
        } else {
        	  return null;
        }
    }

    /**
     * Returns the first child of the Node
     * @function
     * @name Node.firstChild
     * @return {Node|null}
     */
    firstChild() {
      return (this.hasChildren()) ? this.getChild(this.getChildNames()[0]) : [];
    }

    /**
     * Returns the child with the given name. If non-existent a node will be created.
     * @function
     * @name Node.getOrCreateNode
     * @param {string} name
     * @return {Node}
     */
    getOrCreateNode(name) {
        if (this.hasChild(name)) {
            return this.getChild(name);
        } else {
            return this.addNode(name);
        }
    }

    /**
     * Returns the name of the node itself.
     * @function
     * @name Node.getName
     * @return {string} name the name of the node.
     */
    getName() {
        return this._name;
    }

    /**
     * Returns the child names
     * @function
     * @name Node.getChildNames
     * @return {Array<string>}
     */
    getChildNames() {
        let keys = (this.hasChildren()) ? Array.from(this._value.keys()) : [];
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
     * @param {string} protoKey
     * @return {Node}
     * @see Node.constructor
     * @fires Node.add
     */
    addChild(name, datatype, initialValue = null, sync = false, readOnly = false, protoKey = null) {
        if (this.hasChild(name)) {
            return this.getChild(name);
        } else if (name.indexOf('/') == 0) {
            // This is NOT the root leave, don't insert it like this
            throw new Error('Child nodes shall not be prefixed with /');
        } else if (this.isContainer && util.validName.test.bind(name) && util.isValidDataType(datatype)) {

          // Create the child tree node
            let childNode = new Node(this, name, datatype, initialValue, sync, readOnly, protoKey);

            // Add the child tree node to the children map
            this._value.set(name, childNode);

            // JavaScript-Magic for transparent getters and setters
            let self = this;
            Object.defineProperty(self, name, {
                get() {
                    return (childNode.isContainer) ? childNode : childNode.get();
                },
                set(value) {
                    childNode.set(value);
                },
                configurable: true,
                writeable: !readOnly
            });

            // Let the world know, that a new node was born
            this.getRoot().emit('add', childNode);

            // First sync of the newly created child node
            if (sync) {
                childNode.emit('sync', {oldValue: null, newValue: initialValue});
            }

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
            let self = this;
            delete self[name];
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
            return JSON.stringify(entries, null, 2);
        } else if (this._datatype != 'object') {
            // return JSON.stringify(this._value);
            return this._value;
        } else {
            // don't serialize native objects!
            return null;
        }
    }
    
    toObject() {
      if (this.isContainer) {
          let entries = {};
          for (var [name, childNode] of this._value.entries()) {
              entries[name] = childNode.toObject();
          }
          return entries;
      } else if (this._datatype != 'object') {
          return this._value;
      } else {
          // don't serialize native objects!
          return null;
      }
    }

    toJson() {
      return JSON.stringify(toObject(), null, 2);
    }

    /**
     * Iterates over the node and child nodes
     * @function
     * @return {Node}
     */
    [Symbol.iterator]() {
      // Hacky slashy
      let self = this;
      let position = 0;
      let childs = this.getChildNames();

      return {
        next: function() {
          if (position < childs.length) {
            position++;
            return {value: self.getChild(childs[position - 1]), done: false};
          } else {
            return {done: true};
          }
        },
        // Return a well formated iterator
        [Symbol.iterator]: function() {
          return this;
        }
      }
    }

    /**
     * NOTE:
     * For compete traversal one should use iterator with children
     * for (child of node) {
     *  if (child.hasChildren) {
     *    for (children of child) {
     *      // Do this for as much recursion levels as you like
     *    }
     *  }
     * }
     */
}

module.exports = Node;
