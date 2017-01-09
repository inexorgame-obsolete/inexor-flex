// Debugging
const util = require('util');
const debuglog = util.debuglog('configurator');
const tree = require('@inexor-game/tree');
const toml = require('toml');
const glob = require('glob');

exports = module.exports = function(router) {
  debuglog('Got a new router object [%o]', router);

  // Reads the contents from a given absolute path and resolves a tree object
  router.get('file', function(req, res) {
    res.status(200);
  })

  // Dumps a TOML configuration file from a tree object
  router.post('file', function(req, res) {

  })

  // Returns the configurable files in a directory
  router.get('directory', function(req, res) {

  })

  return router;
}

exports['@routable'] = true;
