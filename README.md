# Inexor Flex

[![npm version](https://badge.fury.io/js/%40inexorgame%2Finexor-flex.svg)](https://badge.fury.io/js/%40inexorgame%2Finexor-flex) [![Build Status](https://travis-ci.org/inexorgame/inexor-flex.svg?branch=master)](https://travis-ci.org/inexorgame/inexor-flex) [![Build status](https://ci.appveyor.com/api/projects/status/55kpm71yyetbcpag?svg=true)](https://ci.appveyor.com/project/inexor-game/inexor-flex) [![Dependency Status](https://dependencyci.com/github/inexorgame/inexor-flex/badge)](https://dependencyci.com/github/inexorgame/inexor-flex) [![NSP Status](https://nodesecurity.io/orgs/inexorgame/projects/c53b7d61-a945-44a0-9678-2e555f0c4303/badge)](https://nodesecurity.io/orgs/inexorgame/projects/c53b7d61-a945-44a0-9678-2e555f0c4303)

Inexor Flex is platform for managing [Inexor Core](https://github.com/inexorgame/inexor-core) instances and the Inexor Tree API and provides a scripting environment for servers and clients. Inexor Flex also makes multiple user interfaces using web technologies available.

The reference documentation can be found at [GitHub pages](https://inexorgame.github.io/inexor-flex/docs)

## Introduction
Hello there and welcome to the `inexor-flex` documentation!

Now, you're wondering what `inexor-flex` actually is, and what it does?

Below is a brief explanation about `inexor-flex`:

- we wanted to create a way in which we can easily configure and extend our game
- that's why we created _the `tree`_. It means that all the settings (variables) in the game can be edited in real-time in a tree structure
- but this tree was hard to access. It's sent over the wire in a compressed format, that's hard to work with for _"casual users"_
- next: we created `inexor-flex`. It makes this tree available via a web service (and webviewer). On your local computer.
- not only can you edit the game in real time with `flex`, it also does a bunch of things for you
  - read configuration. e.g for maps, or servers
  - read the server list
  - only your imagination is the limit (...)

## How to set up inexor-flex
You can choose from one of our graphical installers [at our website](http://inexor.org/download).

If you're a little bit more of a techy, here are the command line instructions to install flex

- you need to have `Node.js` installed from [nodejs.org](nodejs.org). The latest stable release is recommended.
- open a terminal/shell
- install flex via `npm i -g @inexorgame/inexor-flex`
- you can start flex via `inexor-flex` directly at your fingertips

_NOTE:_ If you're curious what the graphical installer does. No suprise. Exactly the same.

## What's this _"instances"_ thing?
Since nowadays, all configuration is done via `inexor-flex`, we have introduced a system called `instances`.
Each Inexor client or server is an instance. You can have multiple clients (or servers), with different configurations, even running different versions of the game. No problemo.

## Now let's go fancy. Right at your browser.
If you want to be little bit more of a power user, we also ship a graphical interface for flex. Right there. When you download it.

Just go to [http://localhost:31416/api/v1/interfaces/ui-flex](http://localhost:31416/api/v1/interfaces/ui-flex)
And even more fancy. You can see the `inexor tree` at [http://localhost:31416/api/v1/interfaces/ui-flex/#/instances/31417](http://localhost:31416/api/v1/interfaces/ui-flex/#/instances/31417)

# Developer section

## How to set up inexor-flex as a developer
To set up `inexor-flex` follow the below instructions.

Given that you have cloned `inexor-flex` and are in the `inexor-flex` directory:
```
npm install
npm start # start flex 
```

### The command line
`inexor-flex` brings a verbose command line that can easily be accessed with it's name.
Just call `inexor-flex` from your command line (shell, prompt, terminal), and you can have a lot of options to configure `flex` from the command line.

### Folder structure

Flex is structure in two main folders:

- `src` is where the utilities of flex reside
- `server` is where the actual `flex server` resides. The web server is started here, and all run-time functionality (such as paths) are determined here.

All of the above components are wired together using the [Application Context](https://inexorgame.github.io/inexor-flex/src_context_index.js.html) module.

After _the "wire"_ individual components, such as the package manager are started.

The API is exposed as a [RESTfull API](https://en.wikipedia.org/wiki/Representational_state_transfer).

### Architectual 
`inexor-flex` was initially born to serve the tree of `inexor-core` and this is how it works nowadays.

- we create a _mother inexor_ root node using the `@inexorgame/tree` module
- each instance of Inexor Core has a `src/instances/Connector` attached
- this Connector will create a tree at `/instance/INSTANCEID`
- other modules can be hooked in other namespaces than `/instances`. e.g for the ReleaseManager, the namespace is `/releases`

### Interfaces
Interfaces are graphical user interfaces for `inexor-flex` *and* `inexor-core`.
An interface is basically just a HTML5/CSS/JavaScript folder, which will be made available via the REST API.

Below is a list of the default interfaces shipped with `inexor-flex`:

- [ui-flex](https://github.com/inexorgame/ui-flex) is used to manage the flex server itself
- [ui-console](https://github.com/inexorgame/ui-console) is an interactive console for the game
- [ui-client-hud](https://github.com/inexorgame/ui-client-hud) is a HUD system for the game
- [ui-client-interface](https://github.com/inexorgame/ui-client-interface) are the menu(s) for the game

*NOTE:* For the `ui` modules we currently use [`yarn`](https://yarnpkg.com). You need to execute `yarn` instead of `npm install` to get those running.

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
You can make sure your module matches our standard by running `npm run lint` in the main directory.

When writting a module, please keep the following in mind

- if you write a larger block of code or seperate functionality, consider creating a new module
- by default unit tests with [mocha](mochajs.org) are done for any file that matches `*_test.js`, though it is highly recommended to add a `test` folder to your module
- if necessary (for important or big modules), we urge that you add a separate `README.md` to the respective module

We also try to apply the changes detected by the [`security/recommended`] standard.

### The REST API
The REST API (`v1`) is wired together in `server/api/v1/index.js`
Documentation via [swagger](https://swagger.io/) should follow soon enough.

### Writing an own module
Essentially to write your very first own module, you should go like this

- `mkdir src/YOURMODULE`
- `cd src/YOURMODULE & npm init` which will ask you a bunch of questions
- the name of your module should ideally be `@inexorgame/YOURMODULE`
- your module should export a `index.js` file with it's functionality

Now you can use `npm link` inside the directory. Later on your module can be used via
```
const yourmodule = require('@inexorgame/yourmodule')
```

You can have a look at the `src/types` module, for a very simple and basic module example.

#### Using the API
We have specifically designed the module `@inexorgame/treeclient` to work with the `v1` API.
You can have a look at one of the many command-line tasks in `server/commands/cli/` which will give a fine example on how to use the `treeclient` library.

### Flex won't start. Resolving conflicts with the module manager
If `flex` won't start for strange reasons the most likely thing is that you've worked with a earlier revision in which an individual module is broken.
Try the following:

`npm unlink @inexorgame && npm un -g @inexorgame/inexor-flex`
`rm -rf node_modules`
And then install again.

### Publishing
We use [lerna](https://lernajs.io/) for publishing. The lerna workflow is as following

- install lerna via `npm i -g lerna`
- start publishing via `lerna publish --skip-git`
- this will ask you which semver tag you want to add
- after this it will start publishing the inidividual modules on `npm`

*NOTE:* This will require you to have `npm` installed, be logged in, and have appropriate permissions for the `@inexorgame` orga.

```
npm install -g lerna
lerna publish --skip-git
```

### Future features
This is either to-do or nice to have

- [ ] add example modules and user documentation a-la readthedocs
- [ ] test everything extensively, fix passages that are marked with TODO (and add unit tests!)
- [ ] authentication via OAuth
- [ ] more secure server
- [ ] sandbox-based plugin system
- [ ] server lister and package lister
