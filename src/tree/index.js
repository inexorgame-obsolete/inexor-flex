/**
 * @module tree
 * Provides generic methods to work with bucket-js trees
 * @see buckets-js
 */

const Node = require('./Node');
const Tree = require('./Tree');
const util = require('./util');

module.exports = {
  Node: Node,
  Tree: Tree,
  util: util
}
