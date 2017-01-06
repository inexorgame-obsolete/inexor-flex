/**
 * @module configurator
 * Configures Inexor
 * @see {@link https://github.com/BinaryMuse/toml-node}
 */

const tree = require('@inexor-game/tree');
const glob = require('glob');
const toml = require('toml');


/**
 * configurator function
 * @param  {string} path - the path to traverse
 * @return {Promise}      returns a Promise containing a {@link Root} of parsed TOML objects
 */
function configureDirectory(path) {
  return new Promise((resolve, reject) => {
    glob('**/*.toml', {cwd: path}, (err, files) => {
      if (err) {
        reject(err);
      }

      let config_tree = new tree.Root();
      files.forEach((file) => {
        try {
          let data = toml.parse(file);
          for (entry in Object.entries(data)) {
            tree.createRecursive(entry);
          }
        } catch (e) {
          reject(e);
        }
      })
      resolve(config_tree);
    })
  })
}

module.exports = {
  configureDirectory: configureDirectory
}
