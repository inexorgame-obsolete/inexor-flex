const fs = require("fs");
const path = require('path');
const portscanner = require('portscanner');
const process = require('process');
const util = require('util');

const inexor_path = require('@inexorgame/path');
const inexor_logger = require('@inexorgame/logger');

/**
 * Manager for PID files.
 */
class PidManager {

  constructor(argv) {
    this.argv = argv;
    this.pid = null;
    this.log = inexor_logger('flex.server.PidManager', argv.console, argv.file, argv.level);

    process.on('exit', this.removePid.bind(this));
  }

  /**
   * Locks the combination of the process id and the tcp port to listen on.
   */
  createPid(hostname, port) {
    return new Promise((resolve, reject) => {
      
      // First set the PID file path
      this.pid = path.join(inexor_path.pid_path, util.format('flex.%s.%s.pid', hostname, port));

      // Force ignoring existing PID
      if (this.argv.ignorepid) {
        this.removePid();
        this.writePid();
        resolve({ hostname: hostname, port: port, pid: process.pid });
      }

      // Detect PID file and the availability of the given port
      // Basically six cases
      if (!this.pidExists()) {
        portscanner.checkPortStatus(port, hostname, (error, status) => {
          if (status == 'closed') {
            // No PID file, port not in use
            // Inexor Flex is not running and tcp port is free
            this.writePid();
            resolve({ hostname: hostname, port: port, pid: process.pid });
          } else {
            // No PID file, port in use
            // Inexor Flex is not running but the tcp port is used by another program
            this.log.fatal(util.format('Another program is using port %s:%s. Exiting!', hostname, port));
            process.exit(1);
          }
        });
      } else {
        let processId = this.readPid();
        portscanner.checkPortStatus(port, hostname, (error, status) => {
          if (status == 'closed') {
            // PID file exists, port not in use
            if (processId == process.id) {
              // Same process
              // No need to remove PID file, content would be the same 
              resolve({ hostname: hostname, port: port, pid: processId });
            } else {
              // Another process
              // The other process must be an zombie instance of Inexor Flex (port not in use)!
              let killed = this.killProcess(processId);
              if (killed) {
                this.log.warn(util.format('Detected port %s:%s is not in use. Killed an Inexor Flex zombie process (PID: %s) which previously claimed %s:%s', hostname, port, processId, hostname, port));
              } else {
                this.log.info(util.format('Detected port %s:%s is not in use. Former process (PID: %s) has gone.', hostname, port, processId));
              }
              this.removePid();
              this.writePid();
              resolve({ hostname: hostname, port: port, pid: processId });
            }
          } else {
            // PID file exists, port in use
            if (processId == process.id) {
              // Same process
              // Already running fine
              // Return false to indicate that no further action is needed
              this.log.warn(util.format('This instance of Inexor Flex is already listening on %s:%s and has already written the PID file %s', hostname, port, this.pid));
              reject({ err: 'Already running', hostname: hostname, port: port, pid: processId });
            } else {
              // Another process
              // The other process must be also a running instance of Inexor Flex which blocks the port
              this.log.fatal(util.format('Another instance of Inexor Flex (PID: %s) is already running and using port %s! Exiting!', processId, port));
              process.exit(1);
            }
          }
        });
      }
    });
  }

  removePid() {
    if (this.pidExists()) {
      fs.unlinkSync(this.pid);
      this.log.debug(util.format('PID file %s has been removed successfully', this.pid));
    }
  }

  writePid() {
    fs.writeFileSync(this.pid, String(process.pid));
    this.log.debug(util.format('PID file %s created (PID: %s)', this.pid, process.pid));
  }

  readPid() {
    return fs.readFileSync(this.pid, 'utf8');
  }

  pidExists() {
    let exists = fs.existsSync(this.pid);
    this.log.trace(util.format('PID file %s %s', this.pid, exists ? 'exists' : 'does not exist'));
    return exists;
  }

  killProcess(processId) {
    try {
      process.kill(processId);
      return true;
    } catch (err) {
      this.log.trace(err);
      return false;
    }
  }
  
}

module.exports = PidManager;
