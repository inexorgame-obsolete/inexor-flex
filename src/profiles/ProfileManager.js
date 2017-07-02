/**
 * @module profiles
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const toml = require('toml');
const tomlify = require('tomlify');
const util = require('util');

const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

/**
 * Management service for profiles.
 */
class ProfileManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(applicationContext) {
    super();
    
    /// The application context
    /// this.applicationContext = applicationContext;

    this.profilesLoaded = false;

  }

  /**
   * Sets the dependencies from the application context.
   * @function
   */
  setDependencies() {

    /// The instance manager
    this.instanceManager = this.applicationContext.get('instanceManager');

    /// The log manager
    this.logManager = this.applicationContext.get('logManager');

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing profiles
    this.profilesNode = this.root.getOrCreateNode('profiles');

    /// The name of the default profile (this is the profile to use if Inexor
    /// Flex is started without a profile)
    this.profilesNode.addChild('default', 'string', 'client');

    /// The name of the current profile 
    this.profilesNode.addChild('current', 'string', 'client');

    /// The class logger
    this.log = this.logManager.getLogger('flex.profiles.ProfileManager');

    /// Load profiles.toml at startup
    this.loadProfiles();

    /// Sets the current profile
    this.setCurrentProfile(this.applicationContext.get('argv').profile);

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {

  }

  /**
   * Returns if an profile with the given name exists.
   * @function
   * @param {number} [name] - the profile name
   * @return {boolean} - True, if the profile exists.
   */
  exists(name) {
    return this.profilesNode.hasChild(name);
  }

  /**
   * Creates a new profile.
   * @function
   * @param {string} [name] - the profile name.
   * @param {string} [hostname] - the hostname of Inexor Flex.
   * @param {number} [port] - the grpc port of Inexor Flex.
   * @param {string} [description] - the description of Inexor Flex.
   * @return {Promise<tree.Node>} - the tree node which represents the profile
   */
  create(name, hostname = 'localhost', port = 31416, description = '') {
    return new Promise((resolve, reject) => {
      if (name == null) {
        reject(new Error('Failed to create profile: Missing name'));
      } else if (this.profilesNode.hasChild(name)) {
        reject(new Error('Failed to create profile: Profile already exists'));
      }

      // Create the profile node
      let profileNode = this.profilesNode.addNode(name);

      // The hostname of inexor flex
      profileNode.addChild('hostname', 'string', hostname);

      // The port of inexor flex
      profileNode.addChild('port', 'int32', port);

      // The description
      profileNode.addChild('description', 'string', description);
      
      this.log.debug(util.format('Added profile %s@%s:%d', profileNode.getName(), profileNode.hostname, profileNode.port));

      resolve(profileNode);
    });
  }

  /**
   * Removes the profile with the given name.
   * @function
   * @param {string} [name] - The name of the profile.
   */
  remove(name) {
    return new Promise((resolve, reject) => {
      // TODO: implement
    });
  }

  /**
   * Switches to the profile with the given name.
   * @function
   * @param {string} [name] - The name of the profile.
   */
  switchTo(name) {
    return new Promise((resolve, reject) => {
      // Stop all instances
      this.instanceManager.stopAll().then(() => {
        // Remove all instances
        this.instanceManager.clear().then(() => {
          // Set current profile
          let profileNode = this.setCurrentProfile(name);
          // Remove log configuration
          this.logManager.clear().then(() => {
            // Reconfigure LogManager
            this.logManager.loadLogConfiguration();
            // Load instances
            this.instanceManager.loadInstances().then(() => {
              resolve(profileNode);
            });
          });
        });
      });
    });
  }

  /**
   * Loads the list of profiles from profiles.toml.
   * @function
   * @param {string} [filename] - The filename.
   */
  loadProfiles(filename = 'profiles.toml') {
    if (!this.profilesLoaded) {
      let config_path = this.getProfilesConfigPath(filename);
      this.log.info(util.format('Loading profiles from %s', config_path));
      let data = fs.readFileSync(config_path);
      let config = toml.parse(data.toString());
      for (let name of Object.keys(config.profiles)) {
        if (name == 'default') {
          this.profilesNode.default = config.profiles.default;
        } else {
          this.create(
            name,
            config.profiles[name].hostname,
            config.profiles[name].port,
            config.profiles[name].description
          ).then((profileNode) => {
            // ...
          }).catch((err) => {
            // ...
          });
        }
      }
      this.profilesLoaded = true;
    }
  }

  /**
   * Save the profiles to a TOML file.
   * @function
   * @param {tree.Node} instanceNode - The instance to save.
   * @param {string} [filename] - The filename.
   * @return {Promise<bool>}
   */
  saveProfiles(filename = 'profiles.toml') {
    return new Promise((resolve, reject) => {
      let config_path = this.profileManager.getProfilesConfigPath(filename);
      let profileNames = this.profilesNode.getChildNames();
      let config = {
        profiles: {
          default: this.getDefaultProfile()
        }
      };
      for (var i = 0; i < profileNames.length; i++) {
        let name = profileNames[i];
        let profileNode = this.profilesNode.getChild(name);
        config.profiles[name] = {
          'hostname': profileNode.hostname,
          'port': profileNode.port,
          'description': profileNode.description
        };
      }
      var toml = tomlify(config, {delims: false});
      this.log.trace(toml);
      fs.writeFile(config_path, toml, (err) => {
        if (err) {
          this.log.warn(util.format('Failed to write profiles to %s: %s', config_path, err.message));
          reject(util.format('Failed to write profiles to %s: %s', config_path, err.message));
        } else {
          this.log.info(util.format('Wrote profiles to %s', config_path));
          resolve(true);
        }
      }); 
    });
  }

  /**
   * Returns the path for the given configuration file with respect of the current profile.
   * @function
   * @param {string} [filename] - The filename.
   * @param {string} [profile] - The profile to use or null for the current profile.
   * @return {string} - The path to the configuration file.
   */
  getConfigPath(filename, profile = null) {
    let config_paths = inexor_path.getConfigPaths();
    for (var i = 0; i < config_paths.length; i++) {
      var config_path = config_paths[i];
      if (profile == null) {
        config_path = path.join(config_path, this.getCurrentProfile().getName(), filename);
      } else {
        config_path = path.join(config_path, profile, filename);
      }
      if (fs.existsSync(config_path)) {
        return config_path;
      }
    }
    if (profile == null) {
      return path.join(config_paths[0], this.getCurrentProfile().getName(), filename);
    } else {
      return path.join(config_paths[0], profile, filename);
    }
  }

  /**
   * Returns the path for the given configuration file with respect of the current profile.
   * @function
   * @param {string} [filename] - The filename.
   * @return {string} - The path to the configuration file.
   */
  getProfilesConfigPath(filename) {
    let config_paths = inexor_path.getConfigPaths();
    for (var i = 0; i < config_paths.length; i++) {
      let config_path = path.join(config_paths[i], filename);
      if (fs.existsSync(config_path)) {
        return config_path;
      }
    }
    return path.join(config_paths[0], filename);
  }

  /**
   * Returns the tree node which represents the profile with the given name.
   * @function
   * @param {string} name - The name of the profile.
   * @return {tree.Node} - The tree node which represents the profile.
   */
  getProfile(name) {
    return this.profilesNode.getChild(name);
  }

  /**
   * Returns the tree node which represents the default profile.
   * @function
   * @return {tree.Node} - the tree node which represents the profile.
   */
  getDefaultProfile() {
    this.loadProfiles();
    return this.profilesNode.getChild(this.profilesNode.default);
  }

  /**
   * Returns the name of the default profile.
   * @function
   * @return {string} - The name of the default profile.
   */
  getDefaultProfileName() {
    this.loadProfiles();
    return this.profilesNode.default;
  }

  /**
   * Sets the name of the current profile.
   * 
   * Warning: do not use this function! Use switchTo instead!
   * 
   * @function
   * @param {string} name - The name of the profile.
   */
  setCurrentProfile(name) {
    if (name != null && this.profilesNode.hasChild(name)) {
      this.profilesNode.current = name;
      this.log.info(util.format('Using profile %s', this.getCurrentProfileName()));
    } else {
      this.profilesNode.current = this.profilesNode.default;
      this.log.info(util.format('Using default profile %s', this.getCurrentProfileName()));
    }
    return this.profilesNode.getChild(this.profilesNode.current);
  }

  /**
   * Returns the tree node which represents the current profile.
   * @function
   * @return {tree.Node} - the tree node which represents the profile.
   */
  getCurrentProfile() {
    this.loadProfiles();
    return this.profilesNode.getChild(this.profilesNode.current);
  }

  /**
   * Returns the name of the current profile.
   * @function
   * @return {string} - The name of the current profile.
   */
  getCurrentProfileName() {
    this.loadProfiles();
    return this.profilesNode.current;
  }

  /**
   * Returns the names of the available profiles.
   * @function
   * @return {array} - The list of profile names.
   */
  getAllProfiles() {
    this.loadProfiles();
    return this.profilesNode.getChildNames();
  }

}

module.exports = ProfileManager;

