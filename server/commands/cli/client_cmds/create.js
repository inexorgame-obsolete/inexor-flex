const TreeClient = require('@inexor-game/treeclient').TreeClient;
const log = require('@inexor-game/logger')();

// Configuration for creating a client instance of Inexor Core
exports.command = 'create <instance> [port] [name] [description] [start]'
exports.describe = 'Creates a client'

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
  },
  port: {
    default: null,
    type: 'number',
    describe: 'The port to use. If not given, the port is the same as the instance id.'
  },
  name: {
    default: '',
    type: 'string',
    describe: 'The name of the instance.'
  },
  description: {
    default: '',
    type: 'string',
    describe: 'A description of the instance.'
  },
  start: {
    type: 'boolean',
    descibe: 'Also starts the created instance',
    default: false
  }
}

exports.handler = function(argv) {
  log.info('Creating a client with instance id ' + argv.instance);
  var client = new TreeClient('localhost', 31416);
  client.flex.instances.create(argv.instance, 'client', argv.port, argv.name, argv.description, function(data, response) {
    if (response.statusCode == 201) {
      log.info('Client with instance id ' + argv.instance + ' created');
      if (argv.start) {
        client.flex.instances.start(argv.instance, function(data, response) {
          log.info('  Result: ' + response.statusCode + '(' + response.statusMessage + ')');
          setTimeout(function() {
            log.info('Connecting to the client with id ' + argv.instance);
            client.flex.instances.connect(argv.instance, function(data, response) {
              log.info('  Result: ' + response.statusCode + '(' + response.statusMessage + ')');
              if (response.statusCode == 200) {
                log.info('Connection to client with instance id ' + argv.instance + ' established');
              } else if (response.statusCode == 404) {
                log.info('Client with instance id ' + argv.instance + ' does not exist');
              } else {
                log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
              }
            });
          }, 200);
        });
      } else {
        log.warn('The client was started but no connection is established.');
      }
    } else if (response.statusCode == 409) {
      log.info('Client with instance id ' + argv.instance + ' already exists');
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
