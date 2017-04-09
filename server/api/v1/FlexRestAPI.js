const process = require('process');

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

  }

  /**
   * Shutdown Inexor Flex.
   */
  shutdown(req, res) {
    res.json({absence_message: 'The server is ordered to halt. Beep bup. No more killing ogro.'});
    process.exit();
  }

}

module.exports = FlexRestAPI;
