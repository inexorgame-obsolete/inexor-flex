const cors = require('cors');
const express = require('express');
const express_ws = require('express-ws');
const util = require('util');

const inexor_api = require('@inexorgame/api');
const inexor_path = require('@inexorgame/path');
const inexor_logger = require('@inexorgame/logger');


class FlexServer {

  constructor(argv, pidManager, processManager) {
    this.argv = argv;
    this.pidManager = pidManager;
    this.processManager = processManager;
    this.processManager.on('reload', this.restart.bind(this));

    this.defaultUserInterfaceUrl = '/api/v1/interfaces/ui-flex';

    this.apiNames = [ 'v1' ];

    this.log = inexor_logger('flex.server.FlexServer', this.argv.console, this.argv.file, this.argv.level);

  }

  /**
   * Starts the Inexor Flex server.
   */
  start() {
    this.createApiInstances();
    this.reconfigureLoggers();
    this.createServer();
    this.startListenServer();
  }

  /**
   * Shut down the Inexor Flex server.
   */
  shutdown() {
    this.stopListenServer();
    this.destroyServer();
    this.destroyApiInstances();
    this.reconfigureLoggers();
  }

  /**
   * Restarts the Inexor Flex server.
   */
  restart() {
    this.shutdown();
    this.start();
  }

  /**
   * Create API instances.
   */
  createApiInstances() {
    this.websockets = express_ws(express());
    this.app = this.websockets.app;
    this.apis = {};
    for (let i = 0; i < this.apiNames.length; i += 1) {
      let apiName = this.apiNames[i];
      this.log.debug(util.format('Constructing API %s', apiName));
      this.apis[apiName] = inexor_api[apiName](this.argv, this.app, this.websockets);
    }
  }

  /**
   * Closes and destroys the API instances.
   */
  destroyApiInstances() {
    for (let i = 0; i < this.apiNames.length; i += 1) {
      let apiName = this.apiNames[i];
      this.log.debug(util.format('Calling beforeDestroy for API %s', apiName));
      this.apis[apiName].beforeDestroy();
      this.log.debug(util.format('Destroying context of API %s', apiName));
      this.apis[apiName].destroy();
      delete this.apis[apiName];
    }
    this.apis = {};
  }

  /**
   * Creates and initializes the webserver and wires the API routers.
   */
  createServer() {
    this.app.use(cors());
    this.app.use(this.logRequest.bind(this));
    this.app.use(this.logErrors.bind(this));

    // Wire the routers of each API
    for (let i = 0; i < this.apiNames.length; i += 1) {
      let apiName = this.apiNames[i];
      try {
        this.app.use(util.format('/api/%s/', apiName), this.apis[apiName].get('router'));
        this.log.debug(util.format('Added API %s on route /api/%s/', apiName, apiName));
      } catch (err) {
        this.log.error(util.format('Failed to add API %s on route /api/%s/', apiName, apiName));
      }
    }

    // Creates a redirect for the default interface
    this.app.get('/', this.redirectToDefaultUi.bind(this));

    // Sets the static files
    this.app.use('/static', express.static('node_modules'));

  }

  /**
   * Destroys the server.
   */
  destroyServer() {
    this.app = null;
  }

  /**
   * Start listening the server.
   */
  startListenServer() {
    this.pidManager.createPid(this.getHostname(), this.getPort())
      .then((result) => {
        this.hostname = result.hostname;
        this.port = result.port;
        this.log.debug(util.format('Start listening on http://%s:%s', this.hostname, this.port));
        this.server = this.app.listen(this.port, this.hostname, this.serverInitializationFinished.bind(this));
      })
      .catch((result) => {
        this.hostname = result.hostname;
        this.port = result.port;
        this.log.debug(util.format('Already listening on http://%s:%s', this.hostname, this.port));
      });
  }

  /**
   * Stops listening the server.
   */
  stopListenServer() {
    this.server.close();
    this.log.debug(util.format('Stopped listening on http://%s:%s', this.hostname, this.port));
    this.pidManager.removePid();
    this.port = null;
    this.hostname = null;
  }

  /**
   * Returns the hostname to listen on.
   */
  getHostname() {
    return this.argv.hostname != null ? this.argv.hostname : this.getCurrentProfile().hostname;
  }

  /**
   * Returns the port to listen on.
   */
  getPort() {
    return this.argv.port != null ? this.argv.port : this.getCurrentProfile().port;
  }

  /**
   * Returns the current profile.
   */
  getCurrentProfile() {
    return this.apis.v1.get('profileManager').getCurrentProfile();
  }

  serverInitializationFinished(err) {
    if (err) {
      this.log.error(err, 'Failed to start Inexor Flex');
      this.pidManger.removePid();
      process.exit();
    } else {
      // The webserver and the service level are ready
      this.log.info(util.format('Inexor Flex is listening on http://%s:%s', this.hostname, this.port));
      // Finally load and start the Inexor Core instances
      this.apis.v1.get('instanceManager').loadInstances();
    }
  }

  /**
   * Logs requests.
   */
  logRequest(req, res, next) {
    this.log.info(util.format('[%s] %s -- %s (%s)', req.method, req.originalUrl, req.hostname, req.ip));
    next();
  }

  /**
   * Logs failed requests.
   */
  logErrors(err, req, res, next) {
    this.log.error(err);
    next(err);
  }

  /**
   * Redirects the root URI to the default user interface.
   */
  redirectToDefaultUi(req, res) {
    res.redirect(this.defaultUserInterfaceUrl);
  }

  /**
   * Reconfigures the loggers.
   */
  reconfigureLoggers() {
    if (this.apis.hasOwnProperty('v1')) {
      let logManager = this.apis.v1.get('logManager');
      this.log = logManager.getLogger('flex.server.FlexServer');
      this.pidManager.log = logManager.getLogger('flex.server.PidManager');
      this.processManager.log = logManager.getLogger('flex.server.ProcessManager');
    } else {
      this.log = inexor_logger('flex.server.FlexServer', this.argv.console, this.argv.file, this.argv.level);
      this.pidManager.log = inexor_logger('flex.server.PidManager', this.argv.console, this.argv.file, this.argv.level);
      this.processManager.log = inexor_logger('flex.server.ProcessManager', this.argv.console, this.argv.file, this.argv.level);
    }
  }

}

module.exports = FlexServer;
