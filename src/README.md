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

- since `tree` requires `buckets-js`, it is available as a peer-dependency
- the `link` command makes installing obselete
- both of the above in turn reduce file overhead
