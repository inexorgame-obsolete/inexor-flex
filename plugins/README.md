plugins
======================

The indefenite guide for writing Inexor Plugins
Inexor-Plugins are [electrolyte components](https://www.npmjs.com/package/electrolyte#components), with a simple namespacing rule to be as extensive as possible.

# Using the command line
The `flex` command provides with necessary tools to un/install plugins.
Typing `./flex plugins` will prompt you the available commands.

# How to write a plugin

For writing a plugin, muliple steps are necessary to succeed:

- Bootstraping a `npm` module
- Writing an appropriate module
- Installing it via `npm`
  - from the `npm` registry
  - linking dependencies from other plugins
- Adding routes to be exposed via the API
- ~~Linking to instance tree's~~

## Bootstrapping a npm module
You can bootstrap a new `npm` module just wherever you would like to.
Refer to the npm documentation on how to do this. An example `package.json` can be found in the [src folder](/src/README.md).
For convenience, adding your module to the `plugins` folder will reduce your hassle of installing and testing the plugin.
To be loaded by the `flex plugin` framework, your module *must* be [scoped](https://docs.npmjs.com/misc/scope) with `@inexor-plugins`

## Writing an appropriate module
Our approach is similliar to [electrolyte](https://www.npmjs.com/package/electrolyte). Add a file [as below](#plugin-code-bootstrap) in your [main entry file](https://docs.npmjs.com/files/package.json#main), e.g: `index.js`
Since the framework by default loads all plugins scopes with `@inexor-plugins` you can as well include other plugins as dependencies with `require('@inexor-plugins/nameoftheplugin')`

### Plugin code bootstrap
```js
exports = module.exports = function() {
  return {
    x: 'settingone',
    y: 'settingtwo',
    f: function() {
      // Do something here
    }
  }
}
```

## Installing it via npm
Bear in mind that the commands discussed below must be executed in the `plugins` folder.

### From source
If you've bootstrapped your plugin in the `plugins/` folder, simply `npm install yourpluginfoldername/` should be sufficient.

### From the npm registry
To use your plugin you will first have to publish it to the `npm` registry. See the [documentation](https://docs.npmjs.com/getting-started/publishing-npm-packages).
After publishing your plugin, you can install it as easily as `npm install @inexor-plugins/yourpluginname`

### Linking dependencies from other plugins
If you'd like to use other `@inexor-plugins` objects (e.g to extend their functionality), you can do this by using `npm link`. Refer to the [src documentation](src/README.md#linking) for an example.

## Adding routes
To make your plugin functionality accessable from the `flex` API, you must use the `[@routable]` attribute.
The plugins main [router object](http://expressjs.com/en/4x/api.html#router) will be prepared (to be usable as a REST API, `JSON body parsing` is automatically injected) and provided to your entry function as the first parameter.

```
exports = module.exports = function(router) {
  router.get('xy', function(req, res) {
    res.status(200);
  })

  return router;
}

exports['@routable'] = true;
```

Your routes will be made available at `flex:flexport/api/plugins/yourpluginname/(...)` in which case `(...)` is an isolated router object that you prepared.

# Testing considerations
When you bootstrapped your module in `plugins` the full `flex` [testing toolchain](/README.md#testing) is available for your module as well.

# TODO

- [x] prefix routes with their plugin name
- [x] prefixing will add a namespace security, that prevents overriding
- [ ] add a possibility to interact with instance trees
