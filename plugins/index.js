const package = require('./package.json');
var IoC = require('electrolyte');

plugins = {};
IoC.use(IoC.node_modules()); // Require components from the same directory
Object.keys(package.dependencies).forEach((key) => {
  if (String(key).includes('@inexor-plugins/')) {
    let name = key.split('/')[1]; // Everything after @inexor-plugins/
    let component = IoC.create(name); // Should require the folder
    plugins[name] = component;
  }
})

module.exports = plugins;
