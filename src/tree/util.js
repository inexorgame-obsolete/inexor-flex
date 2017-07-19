/**
 * @property {string} separator - the tree seperator, usually "/"
 */
const separator = '/';
/**
 * @property {RegEX} validName - used for checking valid names
 */
const validName = /^[\w ]+$/;

/**
 * Defines the Flex data type: a virtual object that is not synchronized to the tree.
 * @typedef {mixed} Flex
 */

/**
 * Defines a possible node data type
 * Can be either: Node, int64, string, float, bool or timestamp
 * @typedef {(Node|bool|int64|float|string|timestamp)} datatype
 */

/**
 * Checks whether type has a correct {@link datatype}
 * @name isValidDataType
 * @param {datatype} type
 * @return {boolean}
 */
function isValidDataType(datatype) {
  return datatype == 'node'
    || datatype == 'int32'
    || datatype == 'int64'
    || datatype == 'enum'
    || datatype == 'string'
    || datatype == 'float'
    || datatype == 'bool'
    || datatype == 'timestamp'
    || datatype == 'object'
    || datatype == 'link';
}

module.exports = {
  separator: separator,
  validName: validName,
  isValidDataType: isValidDataType
}
