/**
 * @module api
 * The RESTful API that drives flex.
 * 
 * TODO: swagger documentation, see https://www.npmjs.com/package/swagger-jsdoc
 */

const express = require('express');
const bodyParser = require('body-parser');
// TODO: const stringify = require('json-stringify-safe');
const path = require('path');
const util = require('util');

// Pull the inexor dependencies
const console = require('@inexor-game/console');
const context = require('@inexor-game/context');
const inexor_path = require('@inexor-game/path');
const interfaces = require('@inexor-game/interfaces');
const instances = require('@inexor-game/instances');
const media = require('@inexor-game/media');
const tree = require('@inexor-game/tree');
// const configurator = require('@inexor-game/configurator');

// Import the REST API modules
const InstancesRestAPI = require('./InstancesRestAPI');
const InexorTreeRestAPI = require('./InexorTreeRestAPI');
const MediaRepositoryRestAPI = require('./MediaRepositoryRestAPI');
const FlexRestAPI = require('./FlexRestAPI');

// Build the application context and construct components
let applicationContext = new context.ApplicationContext();
let router = applicationContext.register('router', express.Router());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
let root = applicationContext.construct('tree', function() { return new tree.Root(applicationContext); });
let consoleManager = applicationContext.construct('consoleManager', function() { return new console.ConsoleManager(applicationContext); });
let instanceManager = applicationContext.construct('instanceManager', function() { return new instances.Instances.InstanceManager(applicationContext); });
let mediaRepositoryManager = applicationContext.construct('mediaRepositoryManager', function() { return new media.Repository.MediaRepositoryManager(applicationContext); });
//let media_manager = applicationContext.construct('media_manager', function() { return new media.Media.MediaManager(applicationContext); });
let webUserInterfaceManager = applicationContext.construct('webUserInterfaceManager', function() { return new interfaces.WebUserInterfaceManager(applicationContext); });
let clientLayerManager = applicationContext.construct('clientLayerManager', function() { return new interfaces.ClientLayerManager(applicationContext); });

// Constructing the REST API in a modular way
let instancesRestAPI = new InstancesRestAPI(applicationContext);
let inexorTreeRestAPI = new InexorTreeRestAPI(applicationContext);
let mediaRepositoryRestAPI = new MediaRepositoryRestAPI(applicationContext);
let flexRestAPI = new FlexRestAPI(applicationContext);

module.exports = router;
