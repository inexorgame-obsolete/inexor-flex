/**
 * @module tree
 * Provides generic methods to work with bucket-js trees
 * @see buckets-js
 */

const Node = require('./Node');
const Root = require('./Root');
const util = require('./util');

module.exports = {
  Node: Node,
  Root: Root,
  util: util
}
