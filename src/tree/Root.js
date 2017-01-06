const Node = require('./Node')
const util = require('./util')

/**
 * Represents the inexor root tree
 */
class Root extends Node {
    /**
     * @constructor
     * @see Node.constructor
     */
    constructor() {
        // Initialise this as the root node
        super(null, '', 'node');
    }

    /**
     * Find's a node in the tree
     * @function
     * @name Root.findNode
     * @param {string} path
     * @return {Node}
     */
    findNode(path) {
        let splittedPath = path.split(util.separator);
        let node = this;
        for (let i = 1; i < splittedPath.length; i++) {
            node = node.getChild(splittedPath[i]);
        }

        return node;
        // TODO: Use a binary-tree-search-approach?
        // BSTree could be used for this
    }

    /**
     * Recursively inserts data into a tree
     * @function
     * @name Root.createRecursive
     * @param {string} path
     * @param {datatype} datatype
     * @param {mixed} initialValue
     * @param {boolean} sync
     * @param {boolean} readOnly
     * @param {string} protoKey
     */
    createRecursive(path, datatype, initialValue = null, sync = false, readOnly = false, protoKey = null) {
        let splittedPath = path.split(util.separator);
        var node = this;
        for (let i = 1; i < splittedPath.length - 1; i++) {
            if (!node.hasChild(splittedPath[i])) {
                node = node.addChild(splittedPath[i], 'node');
            } else {
                node = node.getChild(splittedPath[i]);
            }
        }
        if (!node.hasChild(splittedPath[splittedPath.length - 1])) {
            node = node.addChild(splittedPath[splittedPath.length - 1], datatype, initialValue, sync, readOnly, protoKey);
        } else {
            node = node.getChild(splittedPath[splittedPath.length - 1]);
        }
        return node;
    }

    /**
     * Checks wether or not a given path exists in the tree
     * @function
     * @param {string} path
     * @return {boolean}
     */
     contains(path) {
       let node = this.findNode(path);
       return (node != null);
     }
}

module.exports = Root;
