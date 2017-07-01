const cors = require('cors');
const express = require('express');
const util = require('util');

const inexor_api = require('@inexor-game/api');
const inexor_path = require('@inexor-game/path');
const inexor_logger = require('@inexor-game/logger');


class FlexServer {

  constructor(argv, pidManager, processManager) {
    this.argv = argv;
    this.pidManager = pidManager;
    this.processManager = processManager;

    this.defaultUserInterfaceUrl = '/api/v1/interfaces/ui-flex';

    this.log = inexor_logger('flex.server.FlexServer', argv.console, argv.file, argv.level);

    this.apiNames = [ 'v1' ];

    this.createApiInstances();
    this.reconfigureLoggers();
    this.createServer();
    this.pidManager.createPid();
    this.listenServer();
  }

  /**
   * Create instances of the APIs.
   */
  createApiInstances() {
    this.apis = {};
    for (let i = 0; i < this.apiNames.length; i += 1) {
      let apiName = this.apiNames[i];
      this.apis[apiName] = inexor_api[apiName](this.argv);
    }
  }

  /**
   * Creates and initializes the webserver and wires the API routers.
   */
  createServer() {
    this.app = express();
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
   * Start listening the server.
   */
  listenServer() {
    this.port = this.getPort();
    this.hostname = this.getHostname();
    this.log.debug(util.format('Start listening on http://%s:%s', this.hostname, this.port));
    this.server = this.app.listen(this.port, this.hostname, this.serverInitializationFinished.bind(this));
  }

  stopServer() {
    // TODO: express app stop ...
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

  reconfigureLoggers() {
    let logManager = this.apis.v1.get('logManager');
    this.log = logManager.getLogger('flex.server.FlexServer');
    this.pidManager.log = logManager.getLogger('flex.server.PidManager');
    this.processManager.log = logManager.getLogger('flex.server.ProcessManager');
  }

}

module.exports = FlexServer;
