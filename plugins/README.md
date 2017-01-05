@inexor-game/plugins
======================

The indefenite guide for writing Inexor Plugins
Inexor-Plugins are [electrolyte components](https://www.npmjs.com/package/electrolyte#components), with a simple namespacing rule to be as extensive as possible.

# Using the command line
The `flex` command provides with necessary tools to un/install plugins.
Typing `./flex plugins` will prompt you the available commands.

# How to write a plugin

For writing a plugin, muliple steps are necessary to succeed:

- Bootstraping a `npm` module
- Writing an appropriate electrolyte module
- Installing it via `npm`
  - from the `npm` registry
- Adding routes to be exposed via the API
- ~~Linking to instance tree's~~

## Bootstrapping a npm module
You can bootstrap a new `npm` module just wherever you would like to.
Refer to the npm documentation on how to do this. An example `package.json` can be found in the [src folder](/src/README.md).
For convenience, adding your module to the `plugins` folder will reduce your hassle of installing and testing the plugin.
To be loaded by the `flex plugin` framework, your module *must* be [scoped](https://docs.npmjs.com/misc/scope) with `@inexor-plugins`

## Writing an appropriate electrolyte module
Follow down the [electrolyte documentation](https://github.com/jaredhanson/electrolyte) to write a plugin in your [main entry file](https://docs.npmjs.com/files/package.json#main), e.g: `index.js`
Since the framework by default loads all plugins scopes with `@inexor-plugins` you can as well reference other plugins as dependencies with the `[@require]` keyword.

## Installing it via npm
Bear in mind that the commands discussed below must be executed in the `plugins` folder.

### From source
If you've bootstrapped your plugin in the `plugins/` folder, simply `npm install yourpluginfoldername/` should be sufficient.

### From the npm registry
To use your plugin you will first have to publish it to the `npm` registry. See the [documentation](https://docs.npmjs.com/getting-started/publishing-npm-packages).
After publishing your plugin, you can install it as easily as `npm install @inexor-plugins/yourpluginname`

## Adding routes
To make your plugin functionality accessable from the `flex` API, you can add a `routes` attribute to your module.
The convention is provided by the express router functionality, allowing you full flexibility.
A routes object usually looks like this:
```
exports[@routes]: {
  get: {
    '/plugin/:arg': function(req, res) {
      // do something with the request and result objects here
      res.json(plugin.doSomeThing(req.params.arg));
    }
  }
}
```

# Testing considerations
When you bootstrapped your module in `plugins` the full `flex` [testing toolchain](README.md#testing) is available for your module as well.

# TODO

- [ ] add a possibility to interact with instance trees
