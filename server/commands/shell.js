const figlet = require('figlet');
const fs = require('fs');
const path = require('path');
const process = require('process');
const readline = require('readline');
const toml = require('toml');
const util = require('util');
const yargs = require('yargs');

const inexor_path = require('@inexorgame/path');

exports.command = 'shell [profile]'
exports.describe = 'Interactive Inexor Shell'

exports.builder = {
  profile: {
    default: null,
    type: 'string',
    describe: 'The name of the profile.',
    global: false
  },
};

exports.handler = function(argv) {

  console.log(figlet.textSync('INEXOR', { // eslint-disable-line no-console
    font: 'Ghost',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }));
  
  const parser = yargs
    .reset()
    .commandDir('cli')
    .help()
    .showHelp();

  let readline_handler = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    historySize: 50,
    prompt: '> '
  });

  /**
   * Returns the path for the given configuration file with respect of the current profile.
   * @function
   * @param {string} [filename] - The filename.
   * @return {string} - The path to the configuration file.
   */
  let getProfilesConfigPath = function(filename) {
    let configPaths = inexor_path.getConfigPaths();
    for (var i = 0; i < configPaths.length; i++) {
      let configPath = path.join(configPaths[i], filename);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    return path.join(configPaths[0], filename);
  }

  let profilesPath = getProfilesConfigPath('profiles.toml');
  let profilesData = fs.readFileSync(profilesPath);
  let profiles = toml.parse(profilesData.toString());
  profiles.profiles.current = profiles.profiles.default;

  let getCurrentProfile = function() {
    return argv.profile != null ? argv.profile : profiles.profiles.current;
  };

  let getCurrentProfileHostname = function() {
    return profiles.profiles[getCurrentProfile()].hostname;
  };

  let getCurrentProfilePort = function() {
    return profiles.profiles[getCurrentProfile()].port;
  };

  let setCurrentProfile = function(currentProfile) {
    profiles.profiles.current = currentProfile;
    argv.profile = currentProfile;
    let hostname = profiles.profiles[profiles.profiles.current].hostname;
    let port = profiles.profiles[profiles.profiles.current].port;
    process.env['FLEX_SHELL_PROFILE'] = profiles.profiles.current;
    process.env['FLEX_SHELL_HOSTNAME'] = hostname;
    process.env['FLEX_SHELL_PORT'] = port;
  };

  let getPrompt = function() {
    let currentProfile = getCurrentProfile();
    return util.format('%s@%s:%d > ', currentProfile, profiles.profiles[currentProfile].hostname, profiles.profiles[currentProfile].port);
  };
  
  readline_handler.setPrompt(getPrompt());
  readline_handler.prompt();
  
  readline_handler.on('line', function(line) {
    switch (line) {
      case 'exit':
      case 'quit':
        readline_handler.close();
        break;
      default: // eslint-disable-line no-case-declarations
        let argv2 = line.split(' ');
        switch (argv2[0]) {
          case 'use':
            setCurrentProfile(argv2[1]);
            break;
          default:
            console.log(argv2); // eslint-disable-line no-console
            argv2.push('--profileName=' + getCurrentProfile());
            argv2.push('--profileHostname=' + getCurrentProfileHostname());
            argv2.push('--profilePort=' + getCurrentProfilePort());
            parser.parse(argv2, function (err, argv, output) {
              if (output) {
                console.log(output); // eslint-disable-line no-console
              }
            });
            break;
        }
        readline_handler.setPrompt(getPrompt());
        readline_handler.prompt();
        break;
    }
  }).on('close', () => {
    console.log('Thank you for playing Inexor!'); // eslint-disable-line no-console
  }).on('SIGINT', () => {
    readline_handler.close();
  });

};
