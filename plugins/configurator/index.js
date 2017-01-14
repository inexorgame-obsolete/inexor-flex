/**
 * @module inexor-plugins/configurator
 * NOTE: Requires --harmony flag on Node 7.2.1 <=
 */

// Debugging
const util = require('util');
const debuglog = util.debuglog('configurator');
const configurator_util = require('./utils');

// The module expects the absolute path as req.body.path, JSON encoded
exports = module.exports = function(router) {
  // Reads the contents from a given absolute path and resolves a tree object
  router.get('/', function(req, res) {

  });

  // Dumps a TOML configuration file from a tree object
  router.post('/', function(req, res) {

  })

  // Returns available toml files in given directory
  router.get('/directory', function(req, res) {

  })

  return router;
}

exports['@routable'] = true;
exports.util = configurator_util;
