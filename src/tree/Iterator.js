const Node = require('./Node');

/**
 * Iterates over a given tree
 * @function
 * @param {Node} tree
 * @return {mixed}
 */
function makeTreeIterator(tree) {
  let childs = tree.getChildNames();
  let cur = tree.getChild(childs[0]);

  return {
    next: function() {
      if (cur.hasChild()) {
        return makeTreeIterator(cur);
      } else {
        if (childs.length == 0) {
          return {done: true}
        } else {
          childs.shift();
          cur = tree.getChild(childs[0]);
          return {value: cur.get(), done: false}
        }
      }
    }
  }
}

module.exports = makeTreeIterator;
