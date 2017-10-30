// TODO: remove ?

const TreeClient = require('@inexorgame/treeclient').TreeClient;
const path = require('@inexorgame/path');
const log = require('@inexorgame/logger')();

exports.command = 'initialize';
exports.describe = 'Exports the instance according to the config';

exports.handler = function(argv) {
  log.info('Reading file instances.toml');
  let client = new TreeClient('localhost', path.DEFAULT_PORT);
  client.flex.plugins.tomlreader(path.config_path + '/instances.toml', (instances) => {
    // For an empty tree this does nothing
    /* eslint-disable no-undef */
    for(instance in instances) {
      let id = instance._name.split('.')[1];
      // instances.number => number
      let type = instance.getChild('type').get();
      let name = instance.getChild('name').get();
      let description = instance.getChild('description').get();
      let autostart = instance.getChild('autostart').get();
      client.flex.instances.create(id, type, null, name, description, (data, response) => {
        if (response.statusCode == 201) {
          log.info(type + ' with instance id ' + argv.instance + ' created');
        }
        if (autostart) {
          client.flex.start(id, (data, response) => {
            if (response.statusCode == 200) {
              log.info(type + ' with instance id ' + argv.instance + ' started');
            }
          });
        }
      });
    }
    /* eslint-enable no-undef */
  });
}
