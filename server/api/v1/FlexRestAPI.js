const process = require('process');
const os = require('os');
const path = require('path');
const modulePath = path.resolve(path.dirname(require.main.filename), '..');
const { version } = require(path.join(modulePath, 'package.json'));
const inexor_path = require('@inexorgame/path');
const bunyan = require('bunyan'); // Since FlexServer sits on top of @inexorgame/logger sits on top of bunyan we can assume it can be safely included

/**
 * REST API for managing Inexor Flex itself.
 * @module api
 */
class FlexRestAPI {

  /**
   * Constructs the Flex REST API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The log manager
    this.logManager = applicationContext.get('logManager');

    // Shutdown Inexor Flex
    this.router.get('/flex/shutdown', this.shutdown.bind(this));

    // Get Flex version
    this.router.get('/flex/version', this.version.bind(this));

    // Get the flex log
    this.router.get('/flex/log', this.log.bind(this));

    // Get a specific log
    this.router.get('/flex/log/:name', this.log.bind(this));

    // Get system report
    this.router.get('/flex/sysinfo', this.getSysInfo.bind(this));
  }

  /**
   * Shutdown Inexor Flex.
   */
  shutdown(req, res) {
    res.json({absence_message: 'The server is ordered to halt. Beep bup. No more killing ogro.'});
    process.exit();
  }

  /**
   * Prints the current flex version
   */
  version(req, res) {
    res.json({
        version: version
    })
  }

  log(req, res) {
    let name = req.params.name || 'flex.server.FlexServer'
    let logger = this.logManager.getLogger(name);
    let loggerBuffer = logger.streams.find((item) => item.stream instanceof bunyan.RingBuffer)

    res.json(loggerBuffer.stream.records);

  }

  /**
   * Prints system info
   */
  getSysInfo(req, res) {
    res.json({
      platform: os.platform(),
      release: os.release(),
      paths: {
        flex: inexor_path.flex_path,
        config: inexor_path.config_path,
        media: inexor_path.media_path,
        releases: inexor_path.releases_path,
        interfaces: inexor_path.interfaces_path
      }
    })
  }

}

module.exports = FlexRestAPI;
