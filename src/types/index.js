const util = require('util');
const debuglog = util.debuglog('types');
const tree = require('@inexor-game/tree');

/**
 * @module types
 * Converts Core types to JavaScript
 */

/**
* Checks wether or not a number is an integer
* @param  {number} n
* @return {boolean}
*/
function isInt(n) {
 return parseInt(n) === n;
}

/**
 * Returns a valid {@link datatype} for a given JavScript object
 * @param {mixed} value
 * @return {datatype}
 */
function getDataType(value) {
  let type = null;
  if (value instanceof Object && !(value instanceof Date)) {
    type = 'node'; // All container types usually
  } else if (value instanceof Date) {
    type = 'timestamp';
  } else {
    let _type = typeof(value)
    switch(_type) {
      case 'number': type = (isInt(value)) ? 'int64' : 'float'; break;
      case 'boolean': type = 'bool'; break;
      default: type = _type; break;
    }
  }

  return type;
}

/**
 * Returns a UNIX timestamp string for a given {Date}
 * @private
 * @function
 * @param {Date}
 * @return {string}
 */
function getUnixTime(date) {
  return date.getTime()/1000|0; // Taken from https://coderwall.com/p/rbfl6g/how-to-get-the-correct-unix-timestamp-from-any-date-in-javascript
}

/**
 * Returns a {@link Node} for the given {Object}
 * @private
 * @function
 * @param {Object} obj
 * @param {Node} node [null] - used for recursion
 * @return {Node}
 */
function objectToTree(obj, node=null) {
  debuglog('Converting [%o]', obj);
  // Works quiet well since an Array is also in the property chain of an Object
  if (node != null) {
    debuglog('Received node [%o]', node)
    Object.entries(obj).forEach(([key, value]) => {
      debuglog('Processing [%o] with key [%s]', value, key)
      let type = getDataType(value);

      if (type == 'node') {
        let _node = node.addNode(key);
        objectToTree(value, _node);
      } else {
        if (type == 'timestamp') {
          value = getUnixTime(value);
        }

        debuglog('Trying to add [%s] with type [%s]', value, type);
        node.addChild(key, type, value);
      }
    })
  } else {
    let root = new tree.Node(null, '/', 'node');
    debuglog('Added a new root node');

    Object.entries(obj).forEach(([key, value]) => {
      debuglog('Processing [%o] with key [%s]', value, key)
      let type = getDataType(value);

      if (type == 'node') {
        let _node = root.addNode(key);
        objectToTree(value, _node);
      } else {
        if (type == 'timestamp') {
          value = getUnixTime(value);
        }

        debuglog('Trying to add [%s] with type [%s]', value, type);
        root.addChild(key, type, value);
      }
    })

    return root;
  }
}

module.exports = {
  isInt: isInt,
  getDataType: getDataType,
  getUnixTime: getUnixTime,
  objectToTree: objectToTree
}
