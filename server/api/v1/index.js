/**
 * The RESTful API that drives flex.
 * TODO: swagger documentation, see https://www.npmjs.com/package/swagger-jsdoc
 * 
 * @module api
 * 
 */

const express = require('express');
const bodyParser = require('body-parser');
// TODO: const stringify = require('json-stringify-safe');

// Pull the inexor dependencies
const console = require('@inexor-game/console');
const context = require('@inexor-game/context');
const interfaces = require('@inexor-game/interfaces');
const instances = require('@inexor-game/instances');
const logging = require('@inexor-game/logging');
const media = require('@inexor-game/media');
const profiles = require('@inexor-game/profiles');
const gameclient = require('@inexor-game/gameclient');
const gameserver = require('@inexor-game/gameserver');
const tree = require('@inexor-game/tree');

// Import the REST API modules
const ProfilesRestAPI = require('./ProfilesRestAPI');
const InstancesRestAPI = require('./InstancesRestAPI');
const InexorTreeRestAPI = require('./InexorTreeRestAPI');
const MediaRepositoryRestAPI = require('./MediaRepositoryRestAPI');
const FlexRestAPI = require('./FlexRestAPI');

// Import the WS API modules
const InexorTreeWsAPI = require('./InexorTreeWsAPI');

module.exports = function(argv, app, websockets) {

  // Construct the service layer of the application context
  let applicationContext = new context.ApplicationContext();
  let _argv = applicationContext.register('argv', argv);
  applicationContext.register('app', app);
  applicationContext.register('websockets', websockets);
  let router = applicationContext.register('router', express.Router());
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());

  let root = applicationContext.construct('tree', function() { return new tree.Root(applicationContext); });
  let logManager = applicationContext.construct('logManager', function() { return new logging.LogManager(applicationContext); });
  let profileManager = applicationContext.construct('profileManager', function() { return new profiles.ProfileManager(applicationContext); });
  let consoleManager = applicationContext.construct('consoleManager', function() { return new console.ConsoleManager(applicationContext); });
  let instanceManager = applicationContext.construct('instanceManager', function() { return new instances.Instances.InstanceManager(applicationContext); });
  let mediaRepositoryManager = applicationContext.construct('mediaRepositoryManager', function() { return new media.Repository.MediaRepositoryManager(applicationContext); });
  let filesystemRepositoryManager = applicationContext.construct('filesystemRepositoryManager', function() { return new media.Repository.FilesystemRepositoryManager(applicationContext); });
  let gitRepositoryManager = applicationContext.construct('gitRepositoryManager', function() { return new media.Repository.GitRepositoryManager(applicationContext); });
  //let media_manager = applicationContext.construct('media_manager', function() { return new media.Media.MediaManager(applicationContext); });
  let textureManager = applicationContext.construct('textureManager', function() { return new media.TextureManager(applicationContext); });
  let mapManager = applicationContext.construct('mapManager', function() { return new media.MapManager(applicationContext); });
  let webUserInterfaceManager = applicationContext.construct('webUserInterfaceManager', function() { return new interfaces.WebUserInterfaceManager(applicationContext); });

  let intermissionService = applicationContext.construct('intermissionService', function() { return new gameserver.IntermissionService(applicationContext); });
  let mapRotationService = applicationContext.construct('mapRotationService', function() { return new gameserver.MapRotationService(applicationContext); });

  let screenManager = applicationContext.construct('screenManager', function() { return new gameclient.ScreenManager(applicationContext); });
  let layerManager = applicationContext.construct('layerManager', function() { return new gameclient.LayerManager(applicationContext); });

  // Constructing the REST API in a modular way
  let profilesRestAPI = applicationContext.construct('profilesRestAPI', function() { return new ProfilesRestAPI(applicationContext); });
  let instancesRestAPI = applicationContext.construct('instancesRestAPI', function() { return new InstancesRestAPI(applicationContext); });
  let inexorTreeRestAPI = applicationContext.construct('inexorTreeRestAPI', function() { return new InexorTreeRestAPI(applicationContext); });
  let mediaRepositoryRestAPI = applicationContext.construct('mediaRepositoryRestAPI', function() { return new MediaRepositoryRestAPI(applicationContext); });
  let flexRestAPI = applicationContext.construct('flexRestAPI', function() { return new FlexRestAPI(applicationContext); });

  // Constructing the WS API
  let inexorTreeWsAPI = applicationContext.construct('inexorTreeWsAPI', function() { return new InexorTreeWsAPI(applicationContext); });

  // Calling the setDependencies() method of every component in the application context
  applicationContext.setDependencies();

  // Calling the afterPropertiesSet() method of every component in the application context
  applicationContext.afterPropertiesSet();

  return applicationContext;
}

// module.exports = applicationContext;
