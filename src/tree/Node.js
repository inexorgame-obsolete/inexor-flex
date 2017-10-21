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

        // Check the node type (either node, link or a data item)
        if (datatype == 'node') {
            this.isContainer = true;
            this.isLeaf = false;
            // Initializes the map of child nodes.

            this._value = new Map();
        } else if (datatype == 'link') {
            this.isContainer = initialValue.isContainer;
            this.isLeaf = initialValue.isLeaf;
            this._value = initialValue._value;
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
            this.getRoot().emit('postSet', {node: this, oldValue: oldValue, newValue: value});
        }
    }

    /**
     * Checks whether the node has specified child or not
     * @function
     * @name Node.hasChild
     * @param {string} name The name of the child
     * @return {boolean} True, if there is a child with the given name.
     */
    hasChild(name) {
        return this.isContainer && this._value.has(name);
    }

    /**
     * Checks whether the node has children
     * @function
     * @name Node.hasChildren
     * @return {boolean} True, if the node is a container which has child nodes.
     */
    hasChildren() {
        return !this.isContainer || !(this._value.size == 0);
    }

    /**
     * Returns the number of children.
     * @function
     * @name Node.size
     * @return {number} The number of children.
     */
    size() {
        return this.isContainer ? this._value.size : 0;
    }

    /**
     * Returns true, if the node is a child node (recursive) of other_node.
     * @function
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
     * @param {string} name - The name of the child node.
     * @param {tree.datatype} datatype - The datatype of the child node.
     * @param {mixed} initialValue - The initial value of the child node. The type of the initial value must be the given datatype.
     * @param {boolean} sync - If true, the node shall be synchronized automatically. If false, the child node exists locally only.
     * @param {boolean} readOnly - If true, the node cannot be modified.
     * @param {string} protoKey - The key in the .proto file.
     * @return {Node}
     * @see Node.constructor
     * @fires Node.add
     */
    addChild(name, datatype, initialValue = null, sync = false, readOnly = false, protoKey = null) {
        if (this.hasChild(name)) {
            // TODO: we could update the value here, instead of silently returning the node with the previous value
            return this.getChild(name);
        } else if (name.indexOf('/') == 0) {
            // TODO: the name shouldn't contain a slash at all (name.indexOf('/') >= 0)
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

            if (sync) {
                // Let the world know, that a new node was born
                this.getRoot().emit('add', childNode);

                // First sync of the newly created child node
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
     * Adds a child node of type 'node' which is basically a container node.
     * @function
     * @name Node.addNode
     * @property {string} name - The name of the child node.
     * @alias Node.addChild
     */
    addNode(name) {
        return this.addChild(name, 'node');
    }

    /**
     * Adds a child node which is a link to another node in the tree.
     * @function
     * @name Node.addLink
     * @property {string} name - The name of the child node.
     * @property {Node} targetNode - The target node in the tree.
     * @alias Node.addLink
     */
    addLink(name, targetNode) {
        return this.addChild(name, 'link', targetNode);
    }

    /**
     * Removes a child by name.
     * @function
     * @name Node.removeChild
     * @param {string} name - The name of the child node.
     * @param {boolean} force - Forces the removal even if the child node is readOnly.
     * @return {boolean} True if the child node has been deleted. False if there wasn't a child node with the given name or the child node was read only.
     */
    removeChild(name, force = false) {
        if (this.hasChild(name) && (!this.getChild(name)._readOnly || force)) {
            this._value.delete(name);
            let self = this;
            delete self[name];
            return true;
        } else {
            return false;
        }
    }

    /**
     * Removes all children.
     * @function
     * @name Node.removeAllChildren
     */
    removeAllChildren() {
        if (this.isContainer) {
            this._value.clear();
        }
    }

    /**
     * Returns the parent node or null if the tree node is the root node.
     * @function
     * @name Node.getParent
     * @return {Node|null}
     */
    getParent() {
        return (this._path != util.separator) ? this._parent : null;
    }

    /**
     * Returns a JSON string representation of the node.
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

    /**
     * Returns a pure object representation of the node.
     * @function
     * @name Node.toObject
     * @param {number} recursion_limit - The recursion limit. If negative there is no recursion limit.
     * @return {object}
     */
    toObject(recursion_limit = -1) {
        if (this.isContainer) {
            let entries = {};
            for (var [name, childNode] of this._value.entries()) {
                if (recursion_limit < 0) {
                    entries[name] = childNode.toObject(recursion_limit);
                } else if (recursion_limit > 0) {
                    entries[name] = childNode.toObject(recursion_limit - 1);
                }
            }
            return entries;
        } else if (this._datatype != 'object') {
            return this._value;
        } else {
            // don't serialize native objects!
            return null;
        }
    }

    /**
     * Returns a JSON representation.
     * @function
     * @name Node.toJson
     * @param {number} recursion_limit - The recursion limit. If negative there is no recursion limit.
     * @return {string}
     */
    toJson(recursion_limit = -1) {
        return JSON.stringify(this.toObject(recursion_limit), null, 2);
    }

    /**
     * Returns a flat representation of the sub tree.
     * @param {number} depth - depth.
     * @return {object}
     */
    getFlatRepresentation(depth = 0) {
        var entries = {};
        let childNames = this.getChildNames();
        for (let i = 0; i < childNames.length; i++) {
            let childNode = this.getChild(childNames[i]);
            if (childNode.isContainer) {
                entries[childNode._path] = {
                    dataType: childNode._datatype,
                    value: null
                };
            } else {
                entries[childNode._path] = {
                    dataType: childNode._datatype,
                    value: childNode._value
                };
            }
        }
        if (depth > 0) {
            for (let i = 0; i < childNames.length; i++) {
                let childNode = this.getChild(childNames[i]);
                if (childNode.isContainer) {
                    entries = Object.assign(entries, childNode.getFlatRepresentationOfNode(depth - 1));
                }
            }
        }
        return entries;
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
        let children = this.getChildNames();

        return {
            next: function () {
                if (position < children.length) {
                    position++;
                    return {value: self.getChild(children[position - 1]), done: false};
                } else {
                    return {done: true};
                }
            },
            // Return a well formated iterator
            [Symbol.iterator]: function () {
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
