const process = require('process');
const path = require('path');
const modulePath = path.resolve(path.dirname(require.main.filename), '..');
const { version } = require(path.join(modulePath, 'package.json'));

/**
 * REST API for managing Inexor Flex itself.
 */
class FlexRestAPI {

  /**
   * Constructs the Flex REST API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // Shutdown Inexor Flex
    this.router.get('/flex/shutdown', this.shutdown.bind(this));

    // Get Flex version
    this.router.get('/flex/version', this.version.bind(this));

  }

  /**
   * Shutdown Inexor Flex.
   */
  shutdown(req, res) {
    res.json({absence_message: 'The server is ordered to halt. Beep bup. No more killing ogro.'});
    process.exit();
  }

  version(req, res) {
    res.json({
        version: version
    })
  }

}

module.exports = FlexRestAPI;
