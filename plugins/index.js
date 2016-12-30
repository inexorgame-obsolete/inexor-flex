const pluginConfig = require('./plugins.json');
var IoC = require('electrolyte');

// TODO: Add scopes support for security

IoC.use(Ioc.path(pluginConfig.componentDir)); // Require components from the same directory
var plugins = {}
pluginConfig.forEach((v) => {
  plugins[v] = Ioc.create(v);
});

module.exports = plugins;
