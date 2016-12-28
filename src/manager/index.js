/**
 * Is responsible for starting and handling of Inexor Core instances.
 * @module manager
 */

/**
 * A Inexore Core instance
 * @typedef {Object} instance
 * @property {string} args
 * @property {number} pid
 * @property {number} port
 */

/**
 * @function
 * @param {string} args
 * @return {manager.instance}
 */
function start() {

}

/**
 * Stops an instance
 * @function
 * @param {manager.instance}
 * @return {boolean}
 */
function stop() {

}

module.exports = {
  start: start,
  stop: stop
}
