const EventEmitter = require('events');
const os = require('os');
const process = require('process');
const util = require('util');

//const segfaultHandler = require('@inexorgame/segfault-handler');
const inexor_logger = require('@inexorgame/logger');

/**
 * Manager for the Inexor Flex process.
 *
 * Exit handlers:
 *
 * - on SIGHUP a reload is triggered (excluding win32, which exits)
 * - on SIGINT and SIGTERM the process is killed and the PID file is removed
 * - on exiting, a message is printed about the exit code or signal
 * - we cannot handle SIGKILL, in this case the PID file cannot be removed cleanly
 *
 */
class ProcessManager extends EventEmitter {

  constructor(argv, pidManager) {
    super();
    this.argv = argv;
    this.pidManager = pidManager;
    this.log = inexor_logger('flex.server.ProcessManager', argv.console, argv.file, argv.level);

    // Set process title
    process.title = 'inexor';

    this.createProcessHandlers();
  }

  /**
   * Creates handlers for process signals and exit handler.
   */
  createProcessHandlers() {
    let pidManager = this.pidManager;
    let shutdownSignalHandler = this.onShutdownSignal.bind(this);
    //let _segfaultHandler = this.onSegfault.bind(this);
    switch(os.platform()) {
      case 'win32':
        // Different behavior on windows: closing a CMD window
        process.on('SIGHUP', function() { shutdownSignalHandler('SIGHUP', pidManager.removePid.bind(pidManager))});
        break;
      default:
        process.on('SIGHUP', this.onReloadSignal.bind(this));
    }
    process.on('SIGINT', function() { shutdownSignalHandler('SIGINT', pidManager.removePid.bind(pidManager))});
    process.on('SIGTERM', function() { shutdownSignalHandler('SIGTERM', pidManager.removePid.bind(pidManager))});
    process.on('uncaughtException', this.onUncaughtException.bind(this));
    process.on('exit', this.onExit.bind(this));
    //segfaultHandler.registerHandler('crash.log', function(signal, address, stack) { _segfaultHandler(signal, address, stack, pidManager.removePid.bind(pidManager))});
  }

  /**
   * Handle the reload signals.
   * On all platforms but windows.
   */
  onReloadSignal() {
    this.log.info('Got signal SIGHUP. Graceful reloading the server!');
    this.emit('reload');
  }

  /**
   * Handle the shutdown signals.
   */
  onShutdownSignal(signal, removePid) {
    try {
      this.log.info(util.format('Got signal %s. Graceful shutdown', signal));
      removePid();
    } catch (err) {
      this.log.error(err);
    }
    process.exit();
  }

  /**
   * In case segfaults happens in native modules print an error and the stacktrace and
   */
  onSegfault(signal, address, stack, removePid) {
    try {
      this.log.fatal(util.format("Crash in native module (signal %s, address %s)", signal, address));
      this.log.fatal(stack);
      removePid();
    } catch (err) {
      this.log.error(err);
    }
    process.exit(1);
  }

  /**
   * Handle uncaught exceptions.
   */
  onUncaughtException(err) {
    this.log.error(err, 'Uncaught exception!');
  }

  /**
   * On exit print a status message why the process has ended.
   */
  onExit(code, signal) {
    if (code != null) {
      this.log.info(util.format('Inexor Flex process exited with exit code %d', code));
    } else if (signal != null) {
      this.log.info(util.format('Inexor Flex process exited with signal %s', signal));
    }
  }

}

module.exports = ProcessManager;
