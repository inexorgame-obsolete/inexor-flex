/**
 * @module tree
 */

const EventEmitter = require('events');
const util = require('./util')

/**
 * Represents a tree Node
 * @name Node
 * @todo Add a verbose logging system (shouldn't be difficult though)
 * @see module/bunyan
 */
class Node extends EventEmitter {
    /**
     * @constructor
     * @param parent - the parent node
     * @param {string} name - Must not contain whitespace or dots
     * @param {tree.datatype} type - the data type to be used
     * @param {mixed} initValue
     * @param {bool} sync
     * @param {bool} readOnly
     */
    constructor(parent, name, datatype, initialValue = null, sync = false, readOnly = false) {
        // parent constructor
        super();

        /**
         * @member
         * @name Node._parent
         * @type {Node}
         * @private
         */
        this._parent = parent;

        /**
         * @member
         * @name Node._name
         * @type {string}
         * @private
         */
        this._name = name;

        /**
         * @member
         * @name Node._path
         * @type {string}
         * @private
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
         * @member
         * @name Node._datatype
         * @type {tree.datatype}
         * @private
         */

        // The data type of the Node
        if (util.isValidDataType(datatype)) {
            this._datatype = datatype;
        } else {
            throw new Error('Invalid data type');
        }

        /**
         * @member
         * @name Node._readOnly
         * @type {bool}
         * @private
         *
         * @todo this could be done using prototype defines
         */
        this._readOnly = readOnly;

        /**
         * Is a node a container (does it contain children)?
         * @member
         * @name Node.isContainer
         * @type {bool}
         */

        /**
         * Is the node a data leaf?
         * @member
         * @name Node.isLeaf
         * @type {bool}
         */

        /**
         * @member
         * @name Node._value
         * @type {Mixed}
         * @private
         */

        /**
         * @member
         * @name Node._timestamp
         * @type {Date}
         * @private
         */

        /**
         * @member
         * @name Node._sync
         * @type {bool}
         * @private
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
                throw 'No initial value provided';
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
     * @param {bool} preventSync - whether the value should be synchronized or not
     * @fires Node.preSet
     * @fires Node.postSet
     */
    set(value, preventSync = false) {
        if (this.isLeaf && !this._readOnly) {
            let oldValue = this._value;
            this.emit('preSet', {oldValue: oldValue, newValue: value});
            // Update the value
            this._value = value;
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
     * @return {bool}
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
        if (this.hasChild(name)) return this._value.get(name);
    }

    /**
     * Returns the child names
     * @function
     * @name Node.getChildNames
     * @return {string[]}
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
     * @param {bool} sync
     * @param {bool} readOnly
     * @return {Node}
     * @see Node.constructor
     * @fires Node.add
     */
    addChild(name, datatype, initialValue = null, sync = false, readOnly = false) {
        if (this.hasChild(name)) {
            return this.getChild(name);
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

            this.emit('add', name); // Used for subscribing
            return childNode;
        } else {
            throw 'Failed to create child node';
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
     * @return {tree.Node|null}
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
            return entries;
        } else {
            return this._value;
        }
    }
}

module.exports = Node;
