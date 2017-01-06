// API dependencies
const express = require('express');
const bodyParser = require('body-parser');

// Plugin dependencies
const pack = require('./package.json');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/**
 * @private
 * @param {string} key - the plugin key prefixed with @inexor-plugins/
 * @return {string} - the name of the plugin
 */
function getPluginName(key) {
  let name = key.split('/')[1]; // Everything after @inexor-plugins/
}

/**
 * @private
 * @return {Object} - a router object
 */
function freshRouter() {
  let router = express.Router();
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  return router;
}

// THIS is quiet a performance bummer, but it works
Object.keys(pack.dependencies).forEach((key) => {
  if (String(key).includes('@inexor-plugins/')) {
    if (require(key)['@routable']) {
      let r = require(key)(freshRouter()); // NOTE: This calls the exported function
      router.use('/' + getPluginName(key), r);
    }
  }
})

module.exports = router;
