/**
 * @module inexor-plugins/hjsonreader
 * @see {@link inexor-plugins/tomlreader}
 * @see {@link https://github.com/hjson/hjson}
 */

const types = require('@inexor-game/types');
const Hjson = require('hjson');
const tomlreader = require('@inexor-plugins/tomlreader');

// Redundant code makes testing obsolete
function readConfigFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(_path, (err, data) => {
      if (err) reject(err);
      let str = data.toString();
      try {
        resolve(Hjson.parse(str));
      } catch (err) {
        reject(err);
      }
    })
  })
}

// The module expects the absolute path as req.body.path, JSON encoded
exports = module.exports = function(router) {
  // Reads the contents from a given absolute path and resolves a tree object
  router.get('/', function(req, res) {
    if (req.body.path) {
      if (tomlreader.isInMediaOrConfigDirectory(req.body.path)) {
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
