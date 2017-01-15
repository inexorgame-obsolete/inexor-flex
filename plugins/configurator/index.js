/**
 * @module inexor-plugins/configurator
 * NOTE: Requires --harmony flag on Node 7.2.1 <=
 */

// Debugging
const util = require('util');
const debuglog = util.debuglog('configurator');
const configurator_util = require('./utils');
const types = require('@inexor-game/types');
const toml = require('toml-js');

// The module expects the absolute path as req.body.path, JSON encoded
exports = module.exports = function(router) {
  // Reads the contents from a given absolute path and resolves a tree object
  router.get('/read', function(req, res) {
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

  // Dumps a TOML configuration file from a tree object
  // Expects the body object to the the corresponding TOML configuration object in JSON form
  router.get('/dump', function(req, res) {
    if (req.body) {
      try {
        let data = toml.dump(req.body);
        res.type('text/plain').status(200).send(data);
      } catch (err) {
        res.status(500).send(err);
      }
    } else {
      res.status(500).send('No object provided');
    }
  })

  /* Returns available toml files in given directory
  router.get('/directory', function(req, res) {

  })*/

  return router;
}

exports['@routable'] = true;
exports.util = configurator_util;
