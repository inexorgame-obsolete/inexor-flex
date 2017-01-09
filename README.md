# Inexor Flex

Inexor Flex provides a scripting environment for the server and client and provides the Inexor-User-Interface.

## Architecture

* https://github.com/inexor-game/code/wiki/Overall-Architecture
* https://github.com/inexor-game/code/issues/354
* https://github.com/inexor-game/code/issues/348

## Webserver

* Exposes the Inexor Tree API via REST/JSON
* Provides Inexor-User-Interface (HTML5/JS/CSS web application)
* Provides Inexor-Game-HUD (HTML5/JS/CSS web application)

## Business Logic

* Inexor Tree API
* Texture-Manager
* Map-Manager
* Media-Manager (Music, Sound, Videos)
* Server-List-Manager

## Configuration Management

* Reads/writes configuration files from disk / database
* Reads configuration from command line parameters
* Populates the Inexor Tree

## Manages Inexor Kernel instances

* Starts instances of Inexor Kernel

## Operating System Bindings

* Command line arguments parsing
* URI-Scheme
* Tray icon
* Notifications

# Implementation guide

## Styleguide
The coding style-guide proposed by [Airbnb](https://github.com/airbnb/javascript) is desirable.
Since by default `node >=6.9.1` is required, most `ES6` features will work.
Alternately, consider [node.green](http://node.green/) for reference.

## Design guideline
The Inexor Flex has been designed to be as flexible as possible, therefore following a straight design guide:

- everything, if possible, is a module
- loosely-coupled components (such as plugins) are wired using [electrolyte](https://github.com/jaredhanson/electrolyte)
- by default unit tests with mocha are done for any file that matches `*_test.js`, though it is highly recommended to add a `test` folder to your module
- by default documentation is done using JSDoc. don't break that.
- if necessary (for important or big modules), we urge that you add a separate `README.md` to the respective module
- we preserve to *force* the style-guide in the future

## The core implementation
Flex necessarily can't be decoupled as a whole, therefore the core implementation is splitted among the following parts:

- `server/` containing the webserver and RESTfull API
  - `index.js` wires up everything and takes care of the `cli`
- `src/` containing essential modules
  - `src/tree/` contains extensive functions to work with binary trees (*"the root of evil"*)
  - `src/connector` is the gateway to Inexor-Kernel
  - `src/manager` manages Inexor Core instances
  - `src/configurator` reads configuration files and provides them to the game

Since those components tightly couple each other, and *must* work in order to start the game, components from `src` usually are *hard-loaded* via `require`. This in turn means that in order to hook into the API, code must be added manually.

## The RESTfull API
Documentation shall be done via swagger as soon as the `v3 spec` is released, which brings `AnyOf` support.
In the meantime please have a look at [api/v1](https://github.com/OAI/OpenAPI-Specification/pull/741).The comments should be sufficient.

## Writing plugins
Have a look at the [plugin documentation](/plugins/README.md).

## Flex won't start, resolving conflicts with the module manager
If Flex won't start for strange reasons the most likely reason is that you've worked with a earlier revision in which the dependencies weren't at all ready.
By that case you'll most likely get the `master` branch running again following down these steps:

- `unlink` any globally `linked` module with `sudo npm unlink @inexor-game/modulename`
- delete *all* `node_modules` folders using e,g: `rm -r */node_modules && rm -r */*/node_modules`
- install the app again after all with `npm install`, which can take some time (the modules are small, but in a central dependency root they're quiet a bummer)

# TODO
Following is still undone:

 - [x] complete the [plugin framework](/plugins/index.js)
 - [ ] complete the [TOML configurator](/src/configurator/index.js)
 - [ ] add extensive command line arguments to `./flex` [as described in the wiki](https://github.com/inexor-game/code/wiki/Command%20Line%20Options%20And%20Commands)
 - [x] fix the documentation
 - [ ] add a task to automagically reinstall modules once they are changed (for development)
 - [ ] test everything extensively, fix passages that are marked with TODO (and add unit tests!)
 - [ ] glue together UI, Flex and Core with submodules, see [this issue](https://github.com/inexor-game/code/issues/360)
 - [ ] add a `snapcraft.yaml` to package flex independently
