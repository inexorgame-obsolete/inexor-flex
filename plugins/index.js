// Debugging
const util = require('util');
const debuglog = util.debuglog('plugins');

// API dependencies
const express = require('express');
const bodyParser = require('body-parser');

// Plugin dependencies
const pack = require('./package.json');

/**
 * @private
 * @param {string} key - the plugin key prefixed with @inexor-plugins/
 * @return {string} - the name of the plugin
 */
function getPluginName(key) {
  let name = key.split('/')[1]; // Everything after @inexor-plugins/
  return name;
}

/**
 * Prepares a new router object for every plugin
 * @private
 * @return {Object} - a router object
 */
function newRouter() {
  let router = express.Router();
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  return router;
}

// Return a promise since this could take quiet a while
module.exports = new Promise((resolve, reject) => {
  var router = express.Router();
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());

  // List all the plugins
  router.get('/', (req, res) => {
    res.json(router.stack)
  })

  // NOTE: whyever cloning the express.Router() object won't work.
  // Slows down performance quiet a bit
  Object.keys(pack.dependencies).forEach((key) => {
    if (String(key).includes('@inexor-plugins/')) {
      if (require(key)['@routable']) {
        try {
          let r = require(key)(newRouter()); // NOTE: This calls the exported function
          debuglog('Setting up [%o] on namespace [%s]', getPluginName(key), r)
          router.use('/' + getPluginName(key), r);
        } catch(err) {
          reject(err);
        }
      }
    }
  });

  resolve(router);
});
