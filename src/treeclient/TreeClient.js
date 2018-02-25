const Client = require('node-rest-client-patched').Client;
const log = require('@inexorgame/logger')();

/**
 * The client for the local or remote Inexor Tree instances via a REST API.
 * @module treeclient
 * @see {@link https://www.npmjs.com/package/node-rest-client}
 */
class TreeClient {
  /**
   * @constructor
   * @param {string} hostname - the hostname flex listens on
   * @param {number} port - the port that flex listens on
   * @param {number} api_version - the api version that should be used
   */
  constructor(hostname = 'localhost', port = 31416, api_version = 1) {
    this.client = new Client();
    this.hostname = hostname;
    this.port = port;
    this.api_version = api_version;
    this.base_url = 'http://' + hostname + ':' + port + '/api/v' + api_version;
    this.flex = {
      profiles: {
        create: this.createEndpoint('/profiles/${name}', this.createProfile.name, 'POST'),
        remove: this.createEndpoint('/profiles/${name}', this.removeProfile.name, 'DELETE'),
        create: this.createEndpoint('/profiles/${name}/switch', this.switchProfile.name) // eslint-disable-line no-dupe-keys
      },
      instances: {
        getAll: this.createEndpoint('/instances', this.getAllInstances.name),
        get: this.createEndpoint('/instances/${id}', this.getInstance.name),
        create: this.createEndpoint('/instances/${id}', this.createInstance.name, 'POST'),
        remove: this.createEndpoint('/instances/${id}', this.removeInstance.name, 'DELETE'),
        start: this.createEndpoint('/instances/${id}/start', this.startInstance.name),
        startAll: this.createEndpoint('/instances/start', this.startAllInstances.name),
        stop: this.createEndpoint('/instances/${id}/stop', this.stopInstance.name),
        stopAll: this.createEndpoint('/instances/stop', this.stopAllInstances.name),
        connect: this.createEndpoint('/instances/${id}/connect', this.connectInstance.name),
        synchronize: this.createEndpoint('/instances/${id}/synchronize', this.synchronizeInstance.name),
        client: {
          window: {
            fullscreen: this.createEndpoint('/instances/${id}/window/fullscreen/${mode}', this.clientWindowFullscreen.name),
            maximize: this.createEndpoint('/instances/${id}/window/maximize', this.clientWindowMaximize.name),
            minimize: this.createEndpoint('/instances/${id}/window/minimize', this.clientWindowMinimize.name),
            restore: this.createEndpoint('/instances/${id}/window/restore', this.clientWindowRestore.name)
          }
        }
      },
      tree: {
        get: this.createEndpoint('/instances/${id}/${path}', this.getTreeNode.name),
        set: this.createEndpoint('/instances/${id}/${path}', this.setTreeNode.name, 'POST'),
        delete: this.createEndpoint('/instances/${id}/${path}', this.deleteTreeNode.name, 'DELETE'),
        dump: this.createEndpoint('/instances/${id}/dump', this.dumpInstanceTree.name)
      },
      media: {
        repositories: {
          scan: this.createEndpoint('/media/repositories/', this.scanMediaRepositories.name, 'POST'),
          create: this.createEndpoint('/media/repositories/${name}', this.createMediaRepository.name, 'POST'),
          update: this.createEndpoint('/media/repositories/${name}', this.updateMediaRepository.name, 'PUT'),
          branch: this.createEndpoint('/media/repositories/${name}/${branch}', this.branchMediaRepository.name, 'PUT'),
          remove: this.createEndpoint('/media/repositories/${name}', this.removeMediaRepository.name, 'DELETE')
        }
      },
      shutdown: this.createEndpoint('/flex/shutdown', this.shutdownFlex.name),
      version: this.createEndpoint('/flex/version', this.getFlexVersion.name),
      sysinfo: this.createEndpoint('/flex/sysinfo', this.getFlexSysInfo.name),
      log: this.createEndpoint('/flex/log/${name}', this.getFlexLog.name),
    },
    this.releases = { // Since this does not fetch flex releases
      list: this.createEndpoint('/releases', this.listReleases.name),
      fetch: this.createEndpoint('/releases/fetch', this.fetchReleases.name),
      info: this.createEndpoint('/releases/info/${versionRange}/${channelSearch}', this.getReleaseInfo.name),
      download: this.createEndpoint('/releases/download/${versionRange}/${channelSearch}', this.downloadRelease.name),
      install: this.createEndpoint('/releases//install/${versionRange}/${channelSearch}', this.installRelease.name),
      uninstall: this.createEndpoint('/releases/uninstall/${versionRange}/${channelSearch}', this.uninstallRelease.name),
      save: this.createEndpoint('/releases/save', this.saveReleases.name),
      load: this.createEndpoint('/releases/load', this.loadReleases.name)
    }
  }

  /**
   * Creates an endpoint within the Inexor Tree Client
   * @function
   * @param {string} url - the url
   * @param {string} methodName - the name of the method to be called
   * @param {httpMethod} httpMethod - the http method to be used
   */
  createEndpoint(url, methodName, httpMethod = 'GET') {
    this.client.registerMethod(methodName, this.getEndpointUrl(url), httpMethod);
    var self = this;
    var fwrapper = function(...args) {
      self[methodName](...args);
    }
    return fwrapper;
  }

  /**
   * Gets an endpoint url's path
   * @function
   * @param {string} relPath - the relative path to be looked up
   * @return {string}
   */
  getEndpointUrl(relPath) {
    return this.base_url + relPath;
  }

  /**
   * Calls an endpoint
   * @function
   * @param {string} methodName - the method name to be called
   * @param {function} callback - the callback to be feeded with data
   * @param {string} path - the path to call
   * @param {mixed} data - the data to supply to the endpoint
   */
  callEndpoint(methodName, callback, path, data) {
    log.info('Calling endpoint: ' + methodName);
    var args = {
      headers: { 'Content-Type': 'application/json' },
      path: path,
      data: data
    }
    this.client.methods[methodName](args, function(data, response) {
      log.info(response.statusCode + ' ' + String(response.statusMessage));
      log.info(String(data));
      log.info(JSON.stringify(data));
      if (callback && typeof callback === 'function') callback(data, response);
    }).on('error', function(e) {
      log.info('Error: ' + e.code);
    });
  }

  /**
   * Creates a profile.
   * @function
   * @param {string} name - the name of the profile to create.
   * @param {string} hostname - the hostname.
   * @param {number} port - the port.
   * @param {function} callback
   */
  createProfile(name, hostname, port, callback) {
    this.callEndpoint(this.createProfile.name, callback, { name: name }, { hostname: hostname, port: port });
  }

  /**
   * Removes a profile.
   * @function
   * @param {string} name - the name of the profile to remove.
   * @param {function} callback
   */
  removeProfile(name, callback) {
    this.callEndpoint(this.removeProfile.name, callback, { name: name });
  }

  /**
   * Switches to profile.
   * @function
   * @param {string} name - the name of the profile.
   * @param {function} callback
   */
  switchProfile(name, callback) {
    this.callEndpoint(this.switchProfile.name, callback, { name: name });
  }

  /**
   * Returns all the instances to the callback
   * @function
   * @param {function} callback
   */
  getAllInstances(callback) {
    this.callEndpoint(this.getAllInstances.name, callback);
  }

  /**
   * Returns the instances to the callback
   * @function
   * @param {number} id - the instance id
   * @param {function} callback
   */
  getInstance(id, callback) {
    this.callEndpoint(this.getInstance.name, callback, { id: id });
  }

  /**
   * Creates an instance
   * @function
   * @param {number} id - the instance id
   * @param {string} type - the type of the instance: either 'server' or 'client'
   * @param {string} name - the name of the instance
   * @param {string} description - the description of the instance
   * @param {boolean} persistent - True, if the instance should be persisted.
   * @param {boolean} autostart - True, if the instance should be started automatically on startup.
   * @param {boolean} autoconnect - True, if the instance should be connected automatically on startup.
   * @param {boolean} autorestart - True, if the instance should be restarted automatically after shutdown of the instance.
   * @param {function} callback
   */
  createInstance(id, type, name, description, persistent, autostart, autoconnect, autorestart, callback) {
    this.callEndpoint(this.createInstance.name, callback, { id: id }, { args: '', type: type, name: name, description: description, persistent: persistent, autostart: autostart, autoconnect: autoconnect, autorestart: autorestart });
  }

  /**
   * Removes an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  removeInstance(id, callback) {
    this.callEndpoint(this.removeInstance.name, callback, { id: id });
  }

  /**
   * Starts an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  startInstance(id, callback) {
    this.callEndpoint(this.startInstance.name, callback, { id: id });
  }

  /**
   * Starts all available instances
   * @function
   * @param {function} callback
   */
  startAllInstances(callback) {
    this.callEndpoint(this.startAllInstances.name, callback);
  }

  /**
   * Stops an instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  stopInstance(id, callback) {
    this.callEndpoint(this.stopInstance.name, callback, { id: id });
  }

  /**
   * Stops all available instances
   * @function
   * @param {function} callback
   */
  stopAllInstances(callback) {
    this.callEndpoint(this.stopAllInstances.name, callback);
  }

  /**
   * Connects an instance to it's core
   * @function
   * @param {number} id
   * @param {function} callback
   */
  connectInstance(id, callback) {
    this.callEndpoint(this.connectInstance.name, callback, { id: id });
  }

  /**
   * Synchronizes an instance with it's core
   * @function
   * @param {number} id
   * @param {function} callback
   */
  synchronizeInstance(id, callback) {
    this.callEndpoint(this.synchronizeInstance.name, callback, { id: id });
  }

  /**
   * Gets a tree node.
   * @function
   * @param {number} id
   * @param {string} path
   * @param {function} callback
   */
  getTreeNode(id, path, callback) {
    this.callEndpoint(this.getTreeNode.name, callback, { id: id, path: path });
  }

  /**
   * Sets a tree node.
   * @function
   * @param {number} id
   * @param {string} path
   * @param {string} value
   * @param {function} callback
   */
  setTreeNode(id, path, value, nosync, callback) {
    this.callEndpoint(this.setTreeNode.name, callback, { id: id, path: path }, { value: value, nosync: nosync });
  }

  /**
   * Deletes a tree node.
   * @function
   * @param {number} id
   * @param {string} path
   * @param {function} callback
   */
  deleteTreeNode(id, path, callback) {
    this.callEndpoint(this.deleteTreeNode.name, callback, { id: id, path: path });
  }

  /**
   * Dumps the instance tree.
   * @function
   * @param {number} id
   * @param {function} callback
   */
  dumpInstanceTree(id, callback) {
    this.callEndpoint(this.dumpInstanceTree.name, callback, { id: id });
  }

  /**
   * Shuts down the flex server
   * @function
   * @param {function} callback
   */
  shutdownFlex(callback) {
    this.callEndpoint(this.shutdownFlex.name, callback);
  }

  /**
   * Get's the flex version from the API
   * @function
   * @param {function} callback
   */
  getFlexVersion(callback) {
    this.callEndpoint(this.getFlexVersion.name, callback);
  }

  /**
   * Get's the flex sysinfo from the API
   * @function
   * @param {function} callback
   */
  getFlexSysInfo(callback) {
    this.callEndpoint(this.getFlexSysInfo.name, callback);
  }

  /**
   * Get's flex log buffer
   * @function
   * @param {string} name - the name of the log
   */
  getFlexLog(name = 'flex.server.FlexServer', callback) {
    this.callEndpoint(this.getFlexLog.name, callback, { name: name});
  }

  /**
   * Sets the instance (client) to specified window mode.
   * @function
   * @param {number} id
   * @param {string} mode
   * @param {function} callback
   */
  clientWindowFullscreen(id, mode, callback) {
    this.callEndpoint(this.clientWindowFullscreen.name, callback, { id: id, mode: mode });
  }

  /**
   * Maximies the window for given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowMaximize(id, callback) {
    this.callEndpoint(this.clientWindowMaximize.name, callback, { id: id });
  }

  /**
   * Minimizes the window for given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowMinimize(id, callback) {
    this.callEndpoint(this.clientWindowMinimize.name, callback, { id: id });
  }

  /**
   * Restores the window for a given client instance
   * @function
   * @param {number} id
   * @param {function} callback
   */
  clientWindowRestore(id, callback) {
    this.callEndpoint(this.clientWindowRestore.name, callback, { id: id });
  }

  /**
   * Scans for media repositories.
   * @function
   * @param {function} callback
   */
  scanMediaRepositories(callback) {
    this.callEndpoint(this.scanMediaRepositories.name, callback, {});
  }

  /**
   * Creates a media repository with the given name and url.
   * @function
   * @param {string} name - The name of the media repository.
   * @param {string} url - The url of the media repository.
   * @param {function} callback
   */
  createMediaRepository(name, url, callback) {
    if (url != null) {
      // With URL: creates a git repository.
      this.callEndpoint(this.createMediaRepository.name, callback, { name: name }, { type: 'git', url: url });
    } else {
      // Without URL: creates a fs repository.
      this.callEndpoint(this.createMediaRepository.name, callback, { name: name }, { type: 'fs' });
    }
  }

  /**
   * Updates a media repository with the given name. If the media repository is
   * a git repository a 'git pull' is performed.
   * @function
   * @param {string} name - The name of the media repository.
   * @param {function} callback
   */
  updateMediaRepository(name, callback) {
    this.callEndpoint(this.updateMediaRepository.name, callback, { name: name });
  }

  /**
   * Switches to the given branch of the media repository with the given name.
   * If the media repository is a git repository a 'git pull' is performed.
   * @function
   * @param {string} name - The name of the media repository.
   * @param {string} branch - The name of the branch to switch to.
   * @param {function} callback
   */
  branchMediaRepository(name, branch, callback) {
    this.callEndpoint(this.branchMediaRepository.name, callback, { name: name, branch: branch });
  }

  /**
   * Removes a media repository from the Inexor Tree.
   * @function
   * @param {string} name - The name of the media repository.
   * @param {string} path - The path to the media repository.
   * @param {function} callback
   */
  removeMediaRepository(name, callback) {
    this.callEndpoint(this.removeMediaRepository.name, callback, { name: name });
  }

  /**
   * Reads a TOML object using the {@link @inexor-plugins/tomlreader}
   * @function
   * @param {string} path - The path of the file to be read
   * @param {function} callback
   */
  readTOMLConfig(path, callback) {
    this.callEndpoint(this.readTOMLConfig.name, callback, { path: path });
  }

  /**
   * Reads a HJson object using the {@link @inexor-plugins/hjsonreader}
   * @function
   * @param {string} path - The path of the file to be read
   * @param {function} callback
   */
  readHJsonConfig(path, callback) {
    this.callEndpoint(this.readHJsonConfig.name, callback, { path: path });
  }

  /**
   * Returns all the releases to the callback
   * @function
   * @param {function} callback
   */
  listReleases(callback) {
    this.callEndpoint(this.listReleases.name, callback);
  }

  /**
   * Fetches all releases (to the callback)
   * @function
   * @param {function} callback
   */
  fetchReleases(callback) {
    this.callEndpoint(this.fetchReleases.name, callback);
  }

  /**
   * Get's a release info by semantic version range and release channel
   * @function
   * @param {string} versionRange - the release version range
   * @param {string} channel - the release channel
   * @param {function} callback
   */
  getReleaseInfo(versionRange, channelSearch, callback) {
    this.callEndpoint(this.getReleaseInfo.name, callback, { versionRange: versionRange, channelSearch: channelSearch });
  }

  /**
   * Downloads the release
   * @function
   * @param {string} versionRange - the release version range
   * @param {string} channel - the release channel
   * @param {function} callback
   */
  downloadRelease(versionRange, channelSearch, callback) {
    this.callEndpoint(this.downloadRelease.name, callback, { versionRange: versionRange, channelSearch: channelSearch });
  }

  /**
   * Installs the release
   * @function
   * @param {string} versionRange - the release version range
   * @param {string} channelSearch - the release channel
   * @param {function} callback
   */
  installRelease(versionRange, channelSearch, callback) {
    this.callEndpoint(this.installRelease.name, callback, { versionRange: versionRange, channelSearch: channelSearch });
  }

  /**
   * Uninstalls the release
   * @function
   * @param {string} versionRange - the release version range
   * @param {string} channelSearch - the release channel
   * @param {function} callback
   */
  uninstallRelease(versionRange, channelSearch, callback) {
    this.callEndpoint(this.uninstallRelease.name, callback, { versionRange: versionRange, channelSearch: channelSearch });
  }

  /**
   * Saves the release config
   * @function
   * @param {function} callback
   */
  saveReleases(callback) {
    this.callEndpoint(this.saveReleases.name, callback);
  }

  /**
   * Load the release config
   * @function
   * @param {function} callback
   */
  loadReleases(callback) {
    this.callEndpoint(this.loadReleases.name, callback);
  }

}

module.exports = TreeClient;
