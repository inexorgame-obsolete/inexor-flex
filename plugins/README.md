@inexor-game/plugins
======================

The indefenite guide for writing Inexor Plugins
Inexor-Plugins are [electrolyte components](https://www.npmjs.com/package/electrolyte#components), with a simple namespacing rule to be as extensive as possible.

# How to write a plugin

1. Start a new `npm` module somewhere (could be the `plugins` folder as well)
2. Prefix your plugin name with`@inexor-plugins/yourplugin`.
3. Export a singleton function according to the electrolyte guide.
4. Additionally add a `name` attribute with `exports[name] = yourplugin`
5. Copy or clone the module into the `plugins` folder (if you haven't done this in the 1.)
6. Install the plugin with `npm install yourpluginfoldername`
7. This in turn will install plugin dependencies to `plugins/node_modules/`
8. Eh voila. Your plugin is exported in the `plugins/` namespace of our API with it's corresponding `name` attribute.
