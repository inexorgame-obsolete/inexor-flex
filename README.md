# Inexor Flex

[![Build Status](https://travis-ci.org/inexorgame/inexor-flex.svg?branch=master)](https://travis-ci.org/inexorgame/inexor-flex) [![Build status](https://ci.appveyor.com/api/projects/status/55kpm71yyetbcpag?svg=true)](https://ci.appveyor.com/project/inexor-game/inexor-flex) [![Dependency Status](https://dependencyci.com/github/inexorgame/inexor-flex/badge)](https://dependencyci.com/github/inexorgame/inexor-flex)

Inexor Flex is platform for managing Inexor Core instances and the Inexor Tree API and provides a scripting environment for servers and clients. Inexor Flex also makes multiple user interfaces using web technologies available.
Documentation can be found at [GitHub pages](https://inexorgame.github.io/inexor-flex/docs)

## How to set up inexor-flex
Install via `npm install -g @inexorgame/inexor-flex`
You can start flex via `inexor-flex`

## How to set up inexor-flex as a developer
To set up `inexor-flex` follow the below instructions.

Given that you have cloned `inexor-flex` and are in the `inexor-flex` directory:
```
npm install
npm start # start flex 

# if you want to build interfaces to your interfaces path
cd INTERFACES/ui-flex
yarn # <-- currently you must have yarn installed via npm install -g yarn
npm run build

cd ../../
./inexor

# if you're developing and would like to install @inexor-game src
# or install a specific package of your choice
npm install @inexor-game/profiles
```

## Architecture

* https://github.com/inexorgame/code/wiki/Overall-Architecture
* https://github.com/inexorgame/code/issues/354
* https://github.com/inexorgame/code/issues/348

## Webserver

* Exposes the Inexor Tree API via REST/JSON
* Provides multiple web applications (HTML5/JS/CSS)

## Web Applications (HTML5/JS/CSS)

* Inexor Flex User Interface
* Inexor Core (Client) Menu & Application
* Inexor Core (Client) HUD
* Inexor Core (Server) User Interface

## Inexor Tree Client

* Communication to an local or remote instance of Inexor Flex using the Inexor Tree API via REST

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

## Manages Inexor Core instances

* Creates, starts, stops and destroys instances of `Inexor Core`

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
  - `src/connector` is the gateway to an instance of Inexor Core
  - `src/manager` manages Inexor Core instances
  - `src/configurator` reads configuration files and provides them to the game

Since those components tightly couple each other, and *must* work in order to start the game, components from `src` usually are *hard-loaded* via `require`. This in turn means that in order to hook into the API, code must be added manually.

## The RESTfull API
Documentation shall be done via swagger as soon as the `v3 spec` is released, which brings `AnyOf` support.
Please track the following [pull request](https://github.com/OAI/OpenAPI-Specification/pull/741) for updates.

## Flex won't start, resolving conflicts with the module manager
If Inexor Flex won't start for strange reasons the most likely reason is that you've worked with a earlier revision in which the dependencies weren't at all ready.
By that case you'll most likely get the `master` branch running again following down these steps:

- `unlink` any globally `linked` module with `sudo npm unlink @inexor-game/modulename`
- delete *all* `node_modules` folders using e,g: `rm -r */node_modules && rm -r */*/node_modules`
- install the app again after all with `npm install`, which can take some time (the modules are small, but in a central dependency root they're quiet a bummer)

# Adding a user interface
To add a new user interface to flex, you must adapt the following schema

- The package manager of favour is [yarn](yarnpkg.com).
- Your interface must expose a `public` folder with all it's assets
 - `package.json`
 - `public`
  - `img`
  - `js`
  - `css`
  - `index.html`
  - (...)
- Please indicate that your package is a _inexor-ui_ with the `@inexor-ui` scope on `npm`
- Your dependencies will be served from `http(s)://flex_url/static`
- Your interface will be served from `http(s)://flex_url/ui/UINAME`
- `flex` is a reserved module name that will also be an alias for `http(s)://flex_url/ui`

# Publishing
We use [lerna](https://lernajs.io/) for publishing. You can use the following:

```
npm install -g lerna
lerna publish --skip-git
```

# TODO
Following is still undone:

 - [x] add profiles
 - [x] add extensive command line arguments to `./inexor` [as described in the wiki](https://github.com/inexorgame/code/wiki/Command%20Line%20Options%20And%20Commands)
 - [x] fix the documentation
 - [x] make interfaces git-installable
 - [x] make `inexor-flex` a global command and release
 - [ ] test everything extensively, fix passages that are marked with TODO (and add unit tests!)
