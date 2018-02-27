# Inexor Flex

[![package version](https://badge.fury.io/js/%40inexorgame%2Finexor-flex.svg)](https://badge.fury.io/js/%40inexorgame%2Finexor-flex) [![Build Status](https://travis-ci.org/inexorgame/inexor-flex.svg?branch=master)](https://travis-ci.org/inexorgame/inexor-flex) [![Build status](https://ci.appveyor.com/api/projects/status/55kpm71yyetbcpag?svg=true)](https://ci.appveyor.com/project/inexorgame/inexor-flex) [![Dependency Status](https://dependencyci.com/github/inexorgame/inexor-flex/badge)](https://dependencyci.com/github/inexorgame/inexor-flex) [![NSP Status](https://nodesecurity.io/orgs/inexorgame/projects/c53b7d61-a945-44a0-9678-2e555f0c4303/badge)](https://nodesecurity.io/orgs/inexorgame/projects/c53b7d61-a945-44a0-9678-2e555f0c4303)

Inexor Flex is platform for managing [Inexor Core](https://github.com/inexorgame/inexor-core) instances and the Inexor Tree API and provides a scripting environment for servers and clients. Inexor Flex also makes multiple user interfaces using web technologies available.

The reference documentation can be found at [GitHub pages](https://inexorgame.github.io/inexor-flex)
Further introduction and overview: https://github.com/inexorgame/inexor-core/wiki/Inexor-Flex


## Introduction

- we wanted to create a way in which we can easily configure and extend our game
- that's why we created _the `tree`_. It means that all the settings (variables) in the game can be edited in real-time in a tree structure
- but this tree was hard to access. It's sent over the wire in a compressed format, that's hard to work with for _"casual users"_
- next: we created `inexor-flex`. It makes this tree available via a web service (and webviewer). On your local computer.
- not only can you edit the game in real time with `inexor-flex`, it also does a bunch of things for you
  - read configuration. e.g for maps, or servers
  - read the server list
  - only your imagination is the limit (...)


## How to set up Flex
- you need to have `Node.js` installed from [nodejs.org](nodejs.org). The latest stable release is recommended.
- install the [Yarn package manager](https://yarnpkg.com/en/docs/install)

If you **don't want to contribute to Flex itself**, you can install it via
- `yarn global add @inexorgame/inexor-flex`
- now you can start Flex via `inexor-flex`

_NOTE:_ If you're curious what the graphical installer does. No suprise. Exactly the same.

If you are **considering to contribute to Flex**:

- clone this repository
- open a terminal/shell within the Flex repository directory
- install Flex via `yarn install`
- you can start Flex via `yarn start`


## What's this _"instances"_ thing?
Since nowadays, all configuration is done via `inexor-flex`, we have introduced a system called `instances`.
Each Inexor client or server is an instance. You can have multiple clients (or servers), with different configurations, even running different versions of the game.


## Now let's go fancy. Right at your browser.
If you want to be little bit more of a power user, we also ship a graphical interface for flex. Right there. When you download it.

Just go to [http://localhost:31416/api/v1/interfaces/ui-flex](http://localhost:31416/api/v1/interfaces/ui-flex)
And even more fancy. You can see the `Inexor Tree` at [http://localhost:31416/api/v1/interfaces/ui-flex/#/instances/31417](http://localhost:31416/api/v1/interfaces/ui-flex/#/instances/31417)


# Developer section

### The command line
`inexor-flex` brings a verbose command line that can easily be accessed with it's name.
Just call `inexor-flex` from your command line (shell, prompt, terminal), and you can have a lot of options to configure `flex` from the command line.

### Folder structure

Flex is structure in two main folders:

- `src` is where the utilities of Flex reside
- `server` is where the actual `Flex server` resides. The web server is started here, and all run-time functionality (such as paths) are determined here.

All of the above components are wired together using the [Application Context](https://inexorgame.github.io/inexor-flex/src_context_index.js.html) module.

After _the "wire"_ individual components, such as the package manager are started.

The API is exposed as a [RESTfull API](https://en.wikipedia.org/wiki/Representational_state_transfer).


### Architectual
Inexor Flex was initially born to serve the tree of Inexor Core and this is how it works nowadays.

- we create a _mother Inexor_ root node using the `@inexorgame/tree` module
- each instance of Inexor Core has a `src/instances/Connector` attached
- this Connector will create a tree at `/instance/INSTANCEID`
- other modules can be hooked in other namespaces than `/instances`. e.g for the ReleaseManager, the namespace is `/releases`


### Interfaces
Interfaces are graphical user interfaces for Inexor Flex *and* Inexor Core.
An interfaces is basically just HTML5/CSS/JavaScript folders, which will be made available via the REST API.

Below is a list of the default interfaces shipped with Flex:

- [ui-flex](https://github.com/inexorgame/ui-flex) is used to manage the flex server itself
- [ui-console](https://github.com/inexorgame/ui-console) is an interactive console for the game
- [ui-client-hud](https://github.com/inexorgame/ui-client-hud) is a HUD system for the game
- [ui-client-interface](https://github.com/inexorgame/ui-client-interface) are the menu(s) for the game


#### Adding an own interface
An interface should follow the below directory structure:

- Your interface must expose a `dist` folder with all it's assets
- `package.json`
- `dist`
  - `img`
  - `js`
  - `css`
  - `index.html`
  - (...)
- Your dependencies will be served from `http(s)://flex_url/static`
- Your interface will be served from `http(s)://flex_url/api/v1/interfaces/NAME`

You can then use the `interfaces` command line to add your newly written.


### Documentation and style guide
We use [JSDoc](http://usejsdoc.org/) for documentation. All modules from `src` and `server` are automatically added to the documentation, when following the standards.

We endorse the [`eslint:recommended`](https://eslint.org/docs/rules/) rule set, combined with some custom rules.
You can make sure your module matches our standard by running `yarn run lint` in the main directory.

When writting a module, please keep the following in mind

- if you write a larger block of code or seperate functionality, consider creating a new module
- by default unit tests with [mocha](mochajs.org) are done for any file that matches `*_test.js`, though it is highly recommended to add a `test` folder to your module
- if necessary (for important or big modules), we urge that you add a separate `README.md` to the respective module

We also try to apply the changes detected by the [`security/recommended`] standard.


### The REST API
The REST API (`v1`) is wired together in `server/api/v1/index.js`.


### Writing an own module
Essentially to write your very first own module, you should go like this

- create a new directory `src/YOURMODULE`
- execute `yarn init` within your module directory, which will ask you a bunch of questions
- the name of your module has to be `@inexorgame/YOURMODULE`
- your module should export a `index.js` file with it's functionality
- **YOU HAVE TO** add your new module to the `fileDependencies` in the root `package.json`
- after this execute `yarn install` again within the root directory

Later on your module can be used via
```
const yourmodule = require('@inexorgame/yourmodule')
```

You can have a look at the `src/types` module, for a very simple and basic module example.


#### Using the API
We have specifically designed the module `@inexorgame/treeclient` to work with the `v1` API.
You can have a look at one of the many command-line tasks in `server/commands/cli/` which will give a fine example on how to use the `treeclient` library.
