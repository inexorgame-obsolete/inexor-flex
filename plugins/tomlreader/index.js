/**
 * @module inexor-plugins/configurator
 * @see {@link https://www.npmjs.com/package/toml}
 */

// Debugging
const util = require('util');
const debuglog = util.debuglog('configurator');
const tomlreader = require('./utils');
const types = require('@inexor-game/types');

// The module expects the absolute path as req.body.path, JSON encoded
exports = module.exports = function(router) {
  // Reads the contents from a given absolute path and resolves a tree object
  router.get('/', function(req, res) {
    if (req.body.path) {
      if (configurator_util.isInMediaOrConfigDirectory(req.body.path)) {
        readConfigFile(req.body.path).then((obj) => {
          let node = types.objectToTree(obj);
          res.status(200).send(node.toString());
        }).catch((err) => {
          res.status(500).json(err);
        })
      } else {
        res.status(500).send('The specified path ' + req.body.path + ' is not within the valid media or config directorys');
      }
    } else {
      res.status(500).send('You must provide a path object in your request');
    }
  });

  return router;
}

exports['@routable'] = true;
exports.util = tomlreader;
