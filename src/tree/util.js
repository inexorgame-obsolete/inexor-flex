/**
 * @property {string} separator - the tree seperator, usually "/"
 */
const separator = '/';
/**
 * @property {RegEX} validName - used for checking valid names
 */
const validName = /^[\w ]+$/;

/**
 * Defines a possible node data type
 * Can be either: node, int64, string, float, bool or timestamp
 * @typedef {(Node|boolean|number|string|Date)} datatype
 */

/**
 * Checks whether type has a correct {@link datatype}
 * @name isValidDataType
 * @param {datatype} type
 * @return {boolean}
 */
function isValidDataType(datatype) {
    return datatype == 'node' || datatype == 'int64' || datatype == 'string' || datatype == 'float' || datatype == 'bool' || datatype == 'timestamp';
}

module.exports = {
    separator: separator,
    validName: validName,
    isValidDataType: isValidDataType
}
