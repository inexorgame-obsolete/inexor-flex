/**
 * @module configurator
 * Traverses a folder and searches for valid TOML documents
 * Builds an insertable tree object
 */

const tree = require('@inexor-game/tree');
const buckets = require('buckets-js');
const glob = require('glob');
const toml = require('toml');

module.exports = {
  /**
   * configurator function
   * @param  {string} path - the path to traverse
   * @return {Promise}      returns a Promise containing a {@link buckets-js.BStree} of parsed TOML objects
   */
  configureDirectory: function(path) {
    return new Promise((resolve, reject) => {
      glob('**/*.toml', {cwd: path}, (err, files) => {
        if (err) {
          reject(err);
        }

        let config_tree = buckets.BTree();
        files.forEach((file) => {
          try {
            let data = toml.parse(file);
            for (entry in Object.entries(data)) {
              tree.override(entry, config_tree);
            }
          } catch (e) {
            reject(e);
          }
        })
        resolve(config_tree);
      })
    })
  }
}
