src
================

The `src` directory contains essentially important modules for `@inexor-game/flex`

# Installation
Since `npm` is incapable of linking relative paths without pain, in order to bootstrap packages propperly
(e.g for development, testing ..) you must use `link` to install the packages.
For instance, if you'd like to write a package that uses the `tree` package, you would to the following:

- `cd tree && sudo npm link`
- `cd ../your-module && npm link @inexor-game/tree`

This has the following side-effects:

- the `link` command makes installing obselete
- which in turn reduces file overhead

# Package.json example
Following is an example configuration to be used for your `package.json`

```json
{
  "name": "@inexor-game/someawesomemodule",
  "version": "1.0.0",
  "description": "Some awesome module.",
  "main": "index.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/inexor-game/flex.git"
  },
  "keywords": [
    "inexor",
    "someawesomemodule"
  ],
  "author": "The Inexor Team",
  "license": "Zlib",
  "bugs": {
    "url": "https://github.com/inexor-game/flex/issues"
  },
  "homepage": "https://github.com/inexor-game/flex#readme",
  "engines": {
    "node": ">=6.9.1"
  },
  "private": true,
  "dependencies": {}
}
```
