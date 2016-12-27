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
