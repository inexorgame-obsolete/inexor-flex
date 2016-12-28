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
  - `src/configurator` reads configuration files and provides them to the game

Since those components tightly couple each other, and *must* work in order to start the game, components from `src` usually are *hard-loaded* via `require`. This in turn means that in order to hook into the API, code must be added manually.

## The RESTfull API
