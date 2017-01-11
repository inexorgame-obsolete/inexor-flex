// Debugging
const util = require('util');
const debuglog = util.debuglog('configurator');

const tree = require('@inexor-game/tree');
const toml = require('toml');
const glob = require('glob');
const fs = require('fs');

// The module expects the absolute path as req.body.path, JSON encoded
exports = module.exports = function(router) {
  // Reads the contents from a given absolute path and resolves a tree object
  router.get('/', function(req, res) {
    fs.readFile(req.body.path, (err, data) => {
      if (err) throw err;
      let str = data.toString();
      try {
        let data = toml.parse(str);
        let t = new tree.Root();

      } catch (e) {
        res.status(500).json(e);
      }
    });
  })

  // Dumps a TOML configuration file from a tree object
  router.post('/', function(req, res) {

  })

  // Returns available toml files in given directory
  router.get('/directory', function(req, res) {

  })

  return router;
}

exports['@routable'] = true;
