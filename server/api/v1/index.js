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
const console = require('@inexorgame/console');
const context = require('@inexorgame/context');
const interfaces = require('@inexorgame/interfaces');
const instances = require('@inexorgame/instances');
const logging = require('@inexorgame/logging');
const media = require('@inexorgame/media');
const profiles = require('@inexorgame/profiles');
const gameclient = require('@inexorgame/gameclient');
const gameserver = require('@inexorgame/gameserver');
const tree = require('@inexorgame/tree');
const releases = require('@inexorgame/releases');

// Import the REST API modules
const ProfilesRestAPI = require('./ProfilesRestAPI');
const InstancesRestAPI = require('./InstancesRestAPI');
const InexorTreeRestAPI = require('./InexorTreeRestAPI');
const MediaRepositoryRestAPI = require('./MediaRepositoryRestAPI');
const FlexRestAPI = require('./FlexRestAPI');
const ReleasesRestAPI = require('./ReleasesRestAPI');

// Import the WS API modules
const InexorTreeWsAPI = require('./InexorTreeWsAPI');
const ConsoleWsAPI = require('./ConsoleWsAPI');

module.exports = function(argv, app, websockets) {

  // Construct the service layer of the application context
  let applicationContext = new context.ApplicationContext();
  applicationContext.register('argv', argv);
  applicationContext.register('app', app);
  applicationContext.register('websockets', websockets);

  let router = express.Router();
  router.use(bodyParser.urlencoded({ extended: true}))
  router.use(bodyParser.json());
  applicationContext.register('router', router);

  applicationContext.construct('tree', function() { return new tree.Root(applicationContext); });
  applicationContext.construct('logManager', function() { return new logging.LogManager(applicationContext); });
  applicationContext.construct('profileManager', function() { return new profiles.ProfileManager(applicationContext); });
  applicationContext.construct('consoleManager', function() { return new console.ConsoleManager(applicationContext); });
  applicationContext.construct('instanceManager', function() { return new instances.Instances.InstanceManager(applicationContext); });
  applicationContext.construct('mediaRepositoryManager', function() { return new media.Repository.MediaRepositoryManager(applicationContext); });
  applicationContext.construct('filesystemRepositoryManager', function() { return new media.Repository.FilesystemRepositoryManager(applicationContext); });
  applicationContext.construct('gitRepositoryManager', function() { return new media.Repository.GitRepositoryManager(applicationContext); });
  //applicationContext.construct('media_manager', function() { return new media.Media.MediaManager(applicationContext); });
  applicationContext.construct('textureManager', function() { return new media.TextureManager(applicationContext); });
  applicationContext.construct('mapManager', function() { return new media.MapManager(applicationContext); });
  applicationContext.construct('webUserInterfaceManager', function() { return new interfaces.WebUserInterfaceManager(applicationContext); });
  applicationContext.construct('releaseManager', function () { return new releases.ReleaseManager(applicationContext);} );

  applicationContext.construct('intermissionService', function() { return new gameserver.IntermissionService(applicationContext); });
  applicationContext.construct('mapRotationService', function() { return new gameserver.MapRotationService(applicationContext); });

  applicationContext.construct('screenManager', function() { return new gameclient.ScreenManager(applicationContext); });
  applicationContext.construct('layerManager', function() { return new gameclient.LayerManager(applicationContext); });

  // Constructing the REST API in a modular way
  applicationContext.construct('profilesRestAPI', function() { return new ProfilesRestAPI(applicationContext); });
  applicationContext.construct('instancesRestAPI', function() { return new InstancesRestAPI(applicationContext); });
  applicationContext.construct('inexorTreeRestAPI', function() { return new InexorTreeRestAPI(applicationContext); });
  applicationContext.construct('mediaRepositoryRestAPI', function() { return new MediaRepositoryRestAPI(applicationContext); });
  applicationContext.construct('flexRestAPI', function() { return new FlexRestAPI(applicationContext); });
  applicationContext.construct('releasesRestAPI', function() { return new ReleasesRestAPI(applicationContext); });

  // Constructing the WS API
  applicationContext.construct('inexorTreeWsAPI', function() { return new InexorTreeWsAPI(applicationContext); });
  applicationContext.construct('consoleWsAPI', function() { return new ConsoleWsAPI(applicationContext); });

  // Calling the setDependencies() method of every component in the application context
  applicationContext.setDependencies();

  // Calling the afterPropertiesSet() method of every component in the application context
  applicationContext.afterPropertiesSet();

  // Load and start the flex instances after all mandatory features have been fullfilled
  let essentialMediaPromise = new Promise((resolve, reject) => {
    let mediaRepositoryManager = applicationContext.get('mediaRepositoryManager');
    let mediaNode = applicationContext.get('tree').getChild('media');
    let repositoriesNode = mediaNode.getChild('repositories');

    if (!repositoriesNode.hasChild('essential')) {
      resolve(mediaRepositoryManager.gitRepositoryManager.createRepository('essential', mediaRepositoryManager.getRepositoryPath('essential'), 'https://github.com/inexorgame/media-essential.git'));
    } else {
      resolve(`Already satisfied essential repository`);
    }
  })

  let additionalMediaPromise = new Promise((resolve, reject) => {
      let mediaRepositoryManager = applicationContext.get('mediaRepositoryManager');
      let mediaNode = applicationContext.get('tree').getChild('media');
      let repositoriesNode = mediaNode.getChild('repositories');

      if (!repositoriesNode.hasChild('additional')) {
        resolve(mediaRepositoryManager.gitRepositoryManager.createRepository('additional', mediaRepositoryManager.getRepositoryPath('additional'), 'https://github.com/inexorgame/media-additional.git'));
      } else {
        `Already satisfied additional repository`
      }
  })

  Promise.all([essentialMediaPromise, additionalMediaPromise]).then((values) => {
    this.apis.v1.get('instanceManager').loadInstances();
  })

  return applicationContext;
}

// module.exports = applicationContext;
