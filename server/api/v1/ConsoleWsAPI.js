const util = require('util');

const levelNames = {
  60: "fatal",
  50: "error",
  40: "warn",
  30: "info",
  20: "debug",
  10: "trace"
};

/**
 * Websockets API for the Inexor Console.
 */
class ConsoleWsAPI {

  /**
   * Constructs the Inexor Console websockets API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The console manager
    this.consoleManager = applicationContext.get('consoleManager');

//    // The commmand manager
//    this.commandManager = applicationContext.get('commandManager');

    // The express websockets handler
    this.websockets = applicationContext.get('websockets');

    // Returns the value of the tree node.
    this.router.ws('/ws/console', this.handleRequest.bind(this));

    // The web socket server
    this.wss = this.websockets.getWss('/ws/console');

  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.server.api.v1.ws.ConsoleWsAPI');
    
  }

  afterPropertiesSet() {
    this.consoleManager.on('message', this.sendLogMessage.bind(this));
  }

  /**
   * Get or set node values.
   */
  handleRequest(ws, req) { // eslint-disable-line no-unused-vars
    ws.on('message', (message) => {
      try {
        let request = JSON.parse(message);
        switch (request.state) {
          case 'init':
            this.sendInit(ws, request.instanceId);
            break;
          case 'input':
            this.commandManager.handleConsoleInput(request.instanceId, request.input);
            break;
        }
      } catch (err) {
        this.log.error(err, util.format('Failed to process message: %s\n%s', err.message, message));
      }
    });
  }

  sendInit(ws, instanceId) {
    this.log.debug(util.format('New console connection opened for instance %s', instanceId));
    let records = this.consoleManager.getBuffer(instanceId);
    for (let i = 0; i < records.length; i += 1) {
      ws.send(this.getMessageFromRecord(instanceId, records[i]));
    }
  }

  sendLogMessage(message) {
    try {
      this.wss.clients.forEach((client) => {
        client.send(JSON.stringify(message));
      });
    } catch (err) {
      this.log.error(err, util.format('Failed to log message: %s', err.message));
    }
  }

  getMessageFromRecord(instanceId, record) {
    return (JSON.stringify({
      type: 'log',
      instanceId: instanceId,
      message: record.msg,
      level: levelNames[record.level],
      name: record.name,
      time: record.time
    }));
  }

}

module.exports = ConsoleWsAPI;
