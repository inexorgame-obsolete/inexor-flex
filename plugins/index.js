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

Object.keys(pack.dependencies).forEach((key) => {
  if (String(key).includes('@inexor-plugins/')) {
    if (require(key)['@routable']) {
      require(key)(router); // NOTE: This calls the exported function
    }
  }
})

console.log(router);

module.exports = router;
