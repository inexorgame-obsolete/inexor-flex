const npid = require('npid');
const util = require('util');

const inexor_path = require('@inexor-game/path');
const inexor_logger = require('@inexor-game/logger');

/**
 * Manager for PID files.
 */
class PidManager {

  constructor(argv) {
    this.argv = argv;
    this.pid = null;
    this.log = inexor_logger('flex.server.PidManager', argv.console, argv.file, argv.level);
  }

  // Manages startup of Inexor Flex
  // - only a single instance is allowed
  // - a PID file is created or the application refuses to start
  createPid() {
   if (!this.argv.ignorepid) {
     try {
       this.log.debug(util.format('Trying to create PID file: %s', inexor_path.pid_path));
       this.pid = npid.create(inexor_path.pid_path);
       // We also remove the PID file on SIGHUP, SIGINT and SIGTERM
       this.pid.removeOnExit();
       this.log.debug(util.format('PID file %s has been created successfully!', inexor_path.pid_path));
     } catch (err) {
       this.log.fatal(util.format('Could not create pid file %s: %s', inexor_path.pid_path, err.message));
       process.exit(1);
     }
   }
  }

  removePid() {
    if (this.pid != null && !this.pid.remove()) {
      this.log.error(util.format('Exit: Not been able to remove the PID file, remove it manually: %s', inexor_path.pid_path));
    } else {
      this.log.debug(util.format('PID file %s has been removed successfully', inexor_path.pid_path));
    }
  }

}

module.exports = PidManager;
