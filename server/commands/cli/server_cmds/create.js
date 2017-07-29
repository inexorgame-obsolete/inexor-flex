const TreeClient = require('@inexorgame/treeclient').TreeClient;
const log = require('@inexorgame/logger')();

exports.command = 'create <instance> [name] [description] [persistent] [autostart] [autoconnect] [autorestart] [start]';
exports.describe = 'Creates a server';

exports.builder = {
  instance: {
    type: 'number',
    describe: 'The instance id.'
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
  persistent: {
    type: 'boolean',
    describe: 'True, if the instance should be persisted',
    default: false
  },
  autostart: {
    type: 'boolean',
    describe: 'If the instance should be started automatically on startup',
    default: false
  },
  autoconnect: {
    type: 'boolean',
    describe: 'If the instance should be connected automatically on startup',
    default: false
  },
  autorestart: {
    type: 'boolean',
    descibe: 'If the instance should be restarted automatically on startup',
    default: false
  },
  start: {
    type: 'boolean',
    descibe: 'Also starts the created instance immediately',
    default: false
  }
}

exports.handler = function(argv) {
  log.info('Creating a server with instance id ' + argv.instance);
  let client = new TreeClient(argv.profileHostname, argv.profilePort);
  client.flex.instances.create(argv.instance, 'server', argv.name, argv.description, argv.persistent, argv.autostart, argv.autoconnect, argv.autorestart, function(data, response) {
    if (response.statusCode == 201) {
      log.info('Server with instance id ' + argv.instance + ' created');
    } else if (response.statusCode == 409) {
      log.info('Server with instance id ' + argv.instance + ' already exists');
    } else {
      log.info('Response: ' + response.statusCode + ' ' + response.statusMessage);
    }
  });
}
