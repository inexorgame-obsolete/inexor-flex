const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const toml = require('toml');
const url = require('url');
const os = require('os');
const util = require('util');
const AdmZip = require('adm-zip');
const https = require('follow-redirects').https;
const semver = require('semver');

const debuglog = util.debuglog('releases');
const inexor_path = require('@inexorgame/path');

const userAgent = 'Mozilla/4.0 (compatible; MSIE 5.0b1; Mac_PowerPC)'; // It won't let us use a custom API agent, take IE5 than


class ReleaseManager extends EventEmitter {

    /**
     * @constructor
     */
    constructor(applicationContext) {
        super();

        // Hopefully we will support more platforms in the future
        this.platform = this.determinePlatform();
        // NOTE: This is a tiny developer hack for unsupported platforms
        this.platform = (this.platform.length === 0) ? 'win64' : this.platform;

        // The provider which acts as local cache. needs to be of type filesystem
        this.cacheFolder = '';

        // Safe-locks to prevent concurrent tasks
        this.downloading = [];
        this.installing = [];
        this.uninstalling = [];
    }

    /**
     * Sets the dependencies from the application context.
     * @function
     */
    setDependencies() {
        /// The Inexor Tree root node
        this.root = this.applicationContext.get('tree');

        /// The router of the Inexor Flex webserver
        this.router = this.applicationContext.get('router');

        /// The Inexor Tree node containing releases
        this.releaseManagerTreeNode = this.root.getOrCreateNode('releases');
        this.releaseChannelsTreeNode = this.releaseManagerTreeNode.getOrCreateNode('channels');
        this.releaseprovidersTreeNode = this.releaseManagerTreeNode.getOrCreateNode('release_providers');

        /// The class logger
        this.log = this.applicationContext.get('logManager').getLogger('flex.releases.ReleaseManager');
    }

    /**
     * Initialization after the components in the application context have been
     * constructed.
     * @function
     */
    afterPropertiesSet() {
        this.loadConfig().then((resolve, reject) => {
            this.mkdirLocalCache();
            // TODO: Move this task to a scheduler (post start tasks)
            this.checkForNewReleases();
        });
    }

    /**
     * Ensures that the local cache folder is available.
     * @function
     */
    mkdirLocalCache() {
        this.log.debug(`Checking whether the releases directory exists at ${this.cacheFolder}`);
        fs.mkdir(this.cacheFolder, (err) => {
            if (!err) {
                this.log.debug(`Created releases directory at ${this.cacheFolder}`);
            } else if (err.code == 'EEXIST') {
                this.log.trace(`Found existing releases directory at ${this.cacheFolder}`);
            } else if (err.code !== 'EEXIST') {
                this.log.error(`Failed to create releases directory at ${this.cacheFolder}`, err);
            }
        });
    }

    /**
     * @property
     * Is any of the providers currently fetching?
     */
    get fetching() {
        let providersobj = this.releaseprovidersTreeNode.toObject();
        for (let name of Object.keys(providersobj)) {
            if (providersobj[name]['isfetching'] == true) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the path of the releases.toml.
     * @function
     * @param {string} [filename] - The filename.
     * @return {string} - The path to the configuration file.
     */
    getConfigPath(filename = 'releases.toml') {
        let configPaths = inexor_path.getConfigPaths();
        for (var i = 0; i < configPaths.length; i++) {
            var configPath = path.join(configPaths[i], filename);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }
        return filename;
    }

    /**
     * Determines the platform name as uploaded by Travis currently
     * NOTE: Keep this up-to date!
     * @function
     * @return {string} - '{Windows|Linux|Darwin}{32|64}' first is the CMAKE_SYSTEM_NAME, then 32 or 64
     */
    determinePlatform() {
        let platform = '';
        if (os.platform() == 'win32') {
            platform += 'Windows';
        } else if (os.platform() == 'linux') {
            platform += 'Linux';
        } else if (os.platform() == 'darwin') {
            platform += 'Darwin';
        }

        if (['arm64', 'x64'].includes(os.arch())) {
            platform += '64';
        } else {
            platform += '32';
        }

        return platform;
    }

    /**
     * Get version string from the Zip file name uploaded by Travis/Appveyor currently.
     * Returns 0.8.10@stable from inexor-core-0.8.10@stable-Linux.zip
     * valid input is everything fulfilling the pattern inexor-core-<characters>-<this.platform><characters> (so also non-zips)
     * @function
     * @param {string} name - the input string.
     * @return {string|null} - the version or '' if pattern isn't matched
     */
    getVersionStrFromZipName(name) {
        const versionStartIndex = 12; // inexor-core-
        const versionEndIndex = name.indexOf(`-${this.platform}`);  // Gets the index where the platform occurs
        const versionStr = name.substring(versionStartIndex, versionEndIndex);
        this.log.debug(`version found out for ${name}: ${versionStr} (start: ${versionStartIndex}, end: ${versionEndIndex}`);
        if (versionEndIndex == -1 || versionEndIndex < 13) {
            return null;
        }
        return versionStr;
    }

    /**
     * Get the Zip file name uploaded by Travis/Appveyor currently.
     * Returns inexor-core-0.8.10@latest-Linux32.zip if you give it the version 0.8.10 and the channel @latest.
     * @function
     * @param {string} version - the exact version string.
     * @param {string} channel - the exact release channel.
     * @return {string} - inexor-core-<version>-<this.platform>.zip
     */
    makeZipNameFromVersion(version, channel) {
        return `inexor-core-${version}@${channel}-${this.platform}.zip`;
    }

    /**
     * Return the bin folder path of a version.
     * @function
     * @param {string} versionRange -  the semantic version range.
     * @param {string} channelSearch - the release channel.
     * @return {string} - the binary folder of the specific version or ''
     */
    getBinaryPath(versionRange, channelSearch) {
        let releaseNode = this.getRelease(versionRange, channelSearch, true);
        if (!releaseNode) {
            this.log.error(`Could not find at least one installed release matching '${versionRange}' @ ${channelSearch}`);
            return;
        }
        const providerName = releaseNode.getChild('provider').toString();
        if (providerName == 'explicit_path') {
            return releaseNode.path;
        }
        return path.join(releaseNode.path, 'bin');
    }


    /**
     * Returns the name of the executable given its instance type.
     * @function
     * @param {string} instanceType - either client or server: the InexorCore gameserver or gameclient.
     * @return {string} - inexor-core-${instanceType}.exe (on all platforms)
     */
    getExecutableName(instanceType) {
        return `inexor-core-${instanceType}.exe`;
    }

    /**
     * Loads releases from a TOML file.
     * @function
     * @param {string} [filename] - The filename.
     * @return {Promise<bool|string>} - either true or the error reason
     */
    loadConfig(filename = 'releases.toml') {
        return new Promise((resolve, reject) => {
            let configPath = this.getConfigPath(filename);
            this.log.info(`Loading release config from ${configPath}`);
            fs.readFile(configPath, ((err, data) => {
                if (err) {
                    this.log.error(`Failed to load releases config from ${configPath}: ${err.message}`);
                    reject(`Failed to load releases config from ${configPath}: ${err.message}`);
                    return;
                }
                let config = '';
                try {
                    config = toml.parse(data.toString());
                } catch (e) {
                    let errormsg = `Error parsing ${configPath} on line ${e.line}, column ${e.column}: ${e.message}`;
                    this.log.error(errormsg);
                    reject(errormsg);
                    return;
                }
                this.log.info(config);

                if (config.releases['explicit_release_folders']) {
                    for (let i = 0; i < config.releases.explicit_release_folders.length; i++) {
                        // we say the version name is the folder.
                        let fullPath = config.releases.explicit_release_folders[i];
                        let versionName = path.basename(fullPath); // the last folder
                        this.addRelease(versionName, fullPath, true, true, versionName, 'explicit_path');
                    }
                }

                for (let name of Object.keys(config.releases.provider)) {
                    let providerNode = config.releases.provider[name];
                    let needsunpacking = providerNode.needsunpacking == true;
                    this.addProvider(providerNode.name, providerNode.type, providerNode.path, needsunpacking);
                }

                let cache_folder_provider = config.releases['download_destination_provider'];

                // if no cache_folder_provider entry exists, fall back to using the last provider with type filesystem.
                // if none exist: reject
                if (!cache_folder_provider) {
                    let providers_obj = this.releaseprovidersTreeNode.toObject();
                    for (let name of Object.keys(providers_obj)) {
                        if (providers_obj[name].type == 'filesystem') {
                            this.cacheFolder = providers_obj[name].path;
                            resolve(true);
                            return;
                        }
                    }
                    const errmsg = `There was neither a cacheFolder entry nor any release providers of type filesystem in your ${configPath}`;
                    this.log.error(errmsg);
                    reject(false);
                    return;
                }
                if (!this.releaseprovidersTreeNode.hasChild(cache_folder_provider)) {
                    this.log.error(`Cache folder provider error in ${configPath}: provider with name ${cache_folder_provider} does not exists`);
                    reject(false);
                    return
                }
                this.cacheFolder = this.releaseprovidersTreeNode.getChild(cache_folder_provider)['path'];
                this.log.info(`Using the provider ${cache_folder_provider} as cache folder (${this.cacheFolder})`);

                resolve(true);

            }));

        });
    }

    /**
     * Saves release to a TOML file. Currently doing nothing!
     * @function
     * @param {string} [filename] - The filename.
     * @return {Promise<bool|string>} - either true or the error reason
     */
    saveConfig(filename = 'releases.toml') {
        return new Promise((resolve, reject) => {
            this.log.warn(`Saving ${filename} is currently not supported`);
            reject(`Failed to write releases to ${filename}: not supported atm`);
        });
    }

    /**
     * @private
     * Scans folder for subfolders.
     * @param {Object} provider
     * @return {Promise<bool>}
     */
    fetchFromFilesystemProvider(provider) {
        return new Promise((resolve, reject) => {
            let absolutePath = provider['path'];
            this.log.info(`Scanning folder ${absolutePath} for downloaded releases`);
            fs.readdir(absolutePath, (err, items) => {
                if (err) {
                    this.log.error(`Failed to scan folder ${absolutePath} for subfolders: ${err}`);
                    reject(false);
                }

                for (let item of items) {
                    let fullPath = path.join(absolutePath, item);
                    let isFolder = fs.statSync(fullPath).isDirectory();
                    // add all subfolders as releases
                    if (isFolder) {
                        this.addRelease(item, fullPath, true, true, item, provider['name']);
                        continue;
                    }
                    // add all zips which have the right name as not-installed releases
                    let iszip = path.extname(item) == '.zip';
                    if (iszip) {
                        let versionStr = this.getVersionStrFromZipName(item);
                        if (versionStr) {
                            this.addRelease(versionStr, fullPath, true, false, versionStr, provider['name']);
                        }
                        continue;
                    }
                }

                resolve(true);
            });
        });
    }


    /**
     * @private
     * Fetches releases from a REST provider and saves them to the Tree.
     * @param {Object} provider - the provider object in the Tree.
     * @return {Promise<bool>}
     */
    fetchFromRestProvider(provider) {
        const path = provider['path'];
        let isFetchingNode = provider['isfetching'];

        let promise = new Promise((resolve, reject) => {

            if (isFetchingNode == true) {
                this.log.error(`Already fetching latest releases from  ${path} (provider: ${provider['name']})`);
                reject(false);
            }
            isFetchingNode = true;
            this.log.info(`Fetching latest releases from  ${path}`);
            let URL = url.parse(path);

            https.get({
                    host: URL.host,
                    path: URL.path,
                    headers: {
                        'User-Agent': userAgent
                    },
                    timeout: 10000 // wait 10 sec at max
                }, (response) => {
                    let body = '';
                    response.on('data', (d) => body += d);

                    response.on('end', () => {
                        let parsed = JSON.parse(body);
                        debuglog(parsed);
                        isFetchingNode = false;

                        for (let release of parsed) {
                            debuglog(release);
                            this.log.info(release);

                            // find asset path for our platform from json
                            let asset = release.assets.filter((a) => {
                                if (a.content_type != 'application/zip') {
                                    return false;
                                }
                                return a.name.includes(this.platform);
                            });
                            if (asset[0] != null) {
                                this.addRelease(
                                    release.tag_name,
                                    asset[0].browser_download_url,
                                    false,
                                    false,
                                    release.name,
                                    provider['name'],
                                    release.prerelease,
                                    release.created_at
                                );
                            }
                        }

                        resolve(true);
                    });
                }
            );
        });
        return promise;
    }

    /**
     * @private
     * Fetches releases from all available release providers.
     * Inexor Tree: /releases/release_providers/$PROVIDER_NAME
     * @return {Promise<bool>}
     */
    fetchReleases() {
        let promises = [];
        let providers = this.releaseprovidersTreeNode.toObject();
        for (let i of Object.keys(providers)) {
            let provider = providers[i];
            let promise = this.fetchReleasesByProviderType(providers[i]);
            if (promise != null) {
                promises.push(promise);
            }
        }
        // we now have a promises array and return it a single promise
        // which resolves when all promises inside are done.
        return Promise.all(promises);
    }

    /**
     * @private
     * Fetches releases from the given provider by provider type.
     * @return {Promise<bool>}
     */
    fetchReleasesByProviderType(provider) {
        this.log.debug(`Fetching available releases from ${provider['type']} provider ${provider['name']}`);
        switch (provider['type'].toLowerCase()) {
            case 'filesystem':
                return this.fetchFromFilesystemProvider(provider);
            case 'rest':
                return this.fetchFromRestProvider(provider);
            default:
                this.log.warn(`Skipping unknown provider type ${provider['type']} for provider ${provider['name']}`);
                break;
        }
    }

    /**
     * @private
     * Inserts a release into the tree (a virtual one on a remote server, or a filesystem one).
     * If the release already exists, it returns.
     * @param {string} versionStr - the semantical version of the release (+ possible usage of @channel, i.e. 0.1.1@stable
     *                           Note: in the Tree two fields will be set: version and channel (i.e. 0.1.1 and stable)
     * @param {string} path - the filepath to the release on the harddisk or online.
     * @param {bool} isDownloaded - if the release is already on the harddisk.
     * @param {bool} isInstalled - if the release is a zip or already a directory.
     * @param {string} name - optional name for the release.
     * @param {string} provider - the provider name, where the release is currently.
     */
    addRelease(versionStr, path, isDownloaded = false, isInstalled = false, name = '', provider = 'explicit_path', preRelease = null, createdAt = null) {
        // get the version from a version@channel string:
        let version = versionStr;
        let channel = '';
        const channelIndex = versionStr.indexOf(`@`);  // Gets the index where @ occurs in the versionStr
        if (channelIndex != -1) {
            version = versionStr.substring(0, channelIndex);
            channel = versionStr.substring(channelIndex + 1);
        }

        let channelNode = this.releaseChannelsTreeNode.getOrCreateNode(channel);

        if (channelNode.hasChild(version)) {
            // handle that the release is already provided by another provider
            let oldReleaseNode = channelNode[version];
            let old_was_downloaded = oldReleaseNode.getChild('isDownloaded').get();
            let old_was_installed = oldReleaseNode.getChild('isInstalled').get();

            // this release is actually 'better' than the saved one (its downloaded/installed already)
            if ((isInstalled && !old_was_installed) || (isDownloaded && !old_was_downloaded)) {
                oldReleaseNode['path'] = path;
                if (name.length(name)) {
                    oldReleaseNode['name'] = name;
                }
                oldReleaseNode['provider'] = provider;
                oldReleaseNode['isDownloaded'] = isDownloaded;
                oldReleaseNode['isInstalled'] = isInstalled;
            }
            if (preRelease != null) {
                oldReleaseNode.addChild('preRelease', 'bool', preRelease);
            }
            if (createdAt != null) {
                oldReleaseNode.addChild('createdAt', 'string', createdAt);
            }
        } else {
            // handle that the release is not yet provided
            let releaseNode = channelNode.addNode(version);
            releaseNode.addChild('version', 'string', version);
            releaseNode.addChild('channel', 'string', channel);
            releaseNode.addChild('path', 'string', path);
            releaseNode.addChild('name', 'string', name);
            releaseNode.addChild('provider', 'string', provider);
            releaseNode.addChild('isDownloaded', 'bool', isDownloaded);
            releaseNode.addChild('isInstalled', 'bool', isInstalled);
            if (preRelease != null) {
                releaseNode.addChild('preRelease', 'bool', preRelease);
            }
            if (createdAt != null) {
                releaseNode.addChild('createdAt', 'string', createdAt);
            }
            this.emit('onNewReleaseAvailable', version);
            this.log.info(`A release with version ${version} in channel '${channel}' has been added (provider: ${provider})`);
        }
    }

    /**
     * @private
     * Inserts a release provider into the tree.
     * If the name is already in the tree, error and return.
     * @param {string} name - the unique identifier for this provider
     * @param {string} type - either 'filesystem' or 'REST' (case insensitive)
     * @param {string} providerPath - either the URL or path on the filesystem (absolute or relative to path.AppdataLocation[0])
     * @param {string} needsunpacking - does the provider provide zips or folders?
     */
    addProvider(name, type, providerPath, needsunpacking = false) {
        if (this.releaseprovidersTreeNode.hasChild(name)) {

            this.log.warn(`A release provider with name ${name} already exists`);
            return;
        }
        const lowerCaseType = type.toLowerCase();
        if (lowerCaseType != 'filesystem' && lowerCaseType != 'rest') {
            this.log.error(`The release provider ${name} is of unknown type ${type} (supported: rest and filesystem)`);
            return;
        }
        let absolutePath = providerPath;
        if (lowerCaseType == 'filesystem') {
            absolutePath = path.isAbsolute(providerPath) ? providerPath : path.join(inexor_path.releases_path, providerPath);
        }
        //  this.log.warn(`Len before: ${Object(this.releaseprovidersTreeNode).keys.length}`)
        let providerNode = this.releaseprovidersTreeNode.addNode(name);
        providerNode.addChild('name', 'string', name);
        providerNode.addChild('type', 'string', lowerCaseType);
        providerNode.addChild('path', 'string', absolutePath);
        providerNode.addChild('needsunpacking', 'bool', needsunpacking);
        providerNode.addChild('isfetching', 'bool', false);

        this.log.trace(`Release provider ${name} has been added`);
        this.emit('onNewProviderAvailable', name);
    }

    /**
     * Searches through all releases and returns the one fulfilling the semantic version range the best (and is in the same channel).
     * @function
     * @param {string} versionRange - Either:
     *                                    A) the semantic version range it needs to fulfill ('>0.5.2 || 0.3.8')
     *                                    B) an exact non-semantic version ('build', 'buildnew', 'testbinaries')
     * @param {string} channelSearch - additionally you can specify a channel. Only if that channel matches, the release is a match.
     * @param {bool} onlyInstalled - only return release which is installed (meaning no remote one, no zip one)
     * @return {Node|null} - the InexorTree node or null
     */
    getRelease(versionRange, channelSearch = '*', onlyInstalled = false) {
        let returnNode = null;

        for (let channelName of this.releaseChannelsTreeNode.getChildNames()) {

            const releaseChannelNode = this.releaseChannelsTreeNode[channelName];

            // filter out version if channel is not empty and not matching
            if (channelSearch && channelSearch != '*' && channelSearch != channelName) {
                this.log.trace(`Skipping non-matching release: version channel ${channelName} not matching requested channel: ${channelSearch}`);
                continue;
            }

            for (let versionName of releaseChannelNode.getChildNames()) {
                const releaseNode = releaseChannelNode[versionName];

                if (onlyInstalled && !releaseNode.getChild('isInstalled').get()) {
                    // skip not installed ones if 'only_installed' parameter is true.
                    continue;
                }

                if (!semver.valid(releaseNode.version)) {
                    // all version names not being semantic releases are matched for exactness (i.e. 'build')
                    if (releaseNode.version == versionRange) {
                        returnNode = releaseNode;
                    }
                    continue;
                }

                // filter out versions which do not fulfill the version range
                if (!semver.satisfies(releaseNode.version, versionRange)) {
                    this.log.debug(`${versionName}@${channelName} not fulfilling version range: ${versionRange}`);
                    continue;
                }

                // only set if the specific release is of newer version.
                if (!returnNode || semver.gt(releaseNode.version, returnNode.version)) {
                    returnNode = releaseNode;
                }
            }
        }
        if (returnNode) {
            this.log.debug(`Got matching release: ${returnNode.version}@${returnNode.channel} does fulfill '${versionRange}' @ ${channelSearch}`);
        }

        return returnNode;
    }

    /**
     * Searches through all releases and returns the one fulfilling the semantic version range the best (and is in the same channel).
     * If no release is installed, it checks for available releases
     * @function
     * @param {string} versionRange - Either:
     *                                    A) the semantic version range it needs to fulfill ('>0.5.2 || 0.3.8')
     *                                    B) an exact non-semantic version ('build', 'buildnew', 'testbinaries')
     * @param {string} channelSearch - additionally you can specify a channel. Only if that channel matches, the release is a match.
     * @return {Node|null} - the InexorTree node or null
     */
    getOrInstallRelease(versionRange, channelSearch = '*') {
        return new Promise((resolve, reject) => {
            const releaseNode = this.getRelease(versionRange, channelSearch, true);
            if (releaseNode) {
                this.log.trace(`Found already installed release ${releaseNode.version}@${releaseNode.channel}`);
                resolve(releaseNode);
            } else {
                // Currently no release is installed: Check for release available
                this.log.trace(`Didn't find an installed release. Searching for available releases: '${versionRange}' @ ${channelSearch}`);
                const availableReleaseNode = this.getRelease(versionRange, channelSearch, false);
                if (availableReleaseNode) {
                    // Release is available: Download and install release
                    const version = availableReleaseNode.getChild('version').get();
                    const channel = availableReleaseNode.getChild('channel').get();
                    this.log.info(`Found a release which is available, but not yet installed: ${version}@${channel} ! Downloading and installing automatically...`);
                    // Download and install release by exact version and exact channel
                    this.downloadRelease(version, channel, true);
                    this.once('onReleaseInstalled', () => {
                        this.log.trace(`Successfully (downloaded and) installed release ${version}@${channel}`);
                        resolve(availableReleaseNode);
                    });
                } else {
                    reject(new Error(`No version fulfills '${versionRange}' @ ${channelSearch}`));
                }
            }
        });
    }

    /**
     * Checks for new releases and exposes them in the Inexor Tree. See Inexor Tree path: /releases/channels/$CHANNEL_NAME/$VERSION_NUMBER
     *  - version (string) - either a code name or the semver.
     *  - channel (string) - the channel name.
     *  - name (string) - an optional release name.
     *  - path (string) - the path to the version. Depends on the provider type: absolute path for local_cache, URL for github.
     *  - isDownloaded (bool) - whether or not the zip files are already downloaded.
     *  - isInstalled (bool) - whether or not the zip files are already unpacked.
     * @function
     * @return {Promise<bool>} - have a look at {link ReleaseManager.fetchReleases}
     */
    checkForNewReleases() {
        const vm = this;
        return new Promise((resolve, reject) => {
            vm.log.info('Checking for new releases');
            resolve(vm.fetchReleases());
        });
    }

    /**
     * @private
     * Downloads an archive to the given destination.
     * @function downloadArchive
     * @param  {string} archiveURL - The URL of the archive on a remote server.
     * @param  {string} fileName - The target local file name.
     * @param  {string} destinationPath - The target folder where the file should go.
     * @return {Promise<boolean>}
     */
    downloadArchive(archiveURL, fileName, destinationPath) {
        return new Promise((resolve, reject) => {
            let URL = url.parse(archiveURL);
            let filePath = path.resolve(destinationPath, fileName);
            let file = fs.createWriteStream(filePath);
            let request = https.get({
                host: URL.host,
                path: URL.path,
                headers: {
                    'User-Agent': userAgent
                }
            }, (response) => {
                response.pipe(file);
                response.on('end', () => {
                    file.close();
                    resolve(true);
                });
            });
            request.on('error', (err) => {
                this.log.error(`Failed to download archive from ${archiveURL}!`, err);
                file.close();
                fs.unlink(filePath, (err2) => {
                    resolve(false);
                });
            });
        });
    }

    /**
     * Downloads a release for the specific version
     * @function
     * @param {string} versionRange - the semantic version range.
     * @param {string} channelSearch - the release channel.
     * @param {bool} doInstall - true, if the release shall be installed after the download has been completed.
     */
    downloadRelease(versionRange, channelSearch, doInstall = true) {
        let releaseNode = this.getRelease(versionRange, channelSearch);
        if (!releaseNode) {
            this.log.error(`Could not find a release matching '${versionRange}' @ ${channelSearch}. Did you fetch?`);
            return;
        }

        const version = releaseNode.version;
        const channel = releaseNode.channel;
        const versionStr = `${version}@${channel}`;

        if (this.downloading.hasOwnProperty(versionStr) && this.downloading[versionStr]) {
            this.log.error(`Downloading of release ${versionStr} is already in progress`);
            return;
        }
        this.downloading[versionStr] = true;

        let isDownloadedNode = releaseNode.getChild('isDownloaded'); // The TreeNode on a bool
        const isInstalled = releaseNode.getChild('isInstalled').get(); // a bool

        try {
            if (isDownloadedNode.get() && !isInstalled && doInstall) {
                // The release is already downloaded but not yet installed
                this.log.trace(`The release ${versionStr} is already downloaded but not yet installed`);
                this.installRelease(version, channel);
                return;
            }

            // only REST providers come here

            const urlNode = releaseNode.getChild('path');
            const zipFilename = this.makeZipNameFromVersion(version, channel);

            this.downloadArchive(urlNode.get(), zipFilename, this.cacheFolder).then((success) => {
                this.downloading[versionStr] = false;
                if (success) {
                    isDownloadedNode.set(true);
                    releaseNode.path = path.join(this.cacheFolder, zipFilename);
    
                    this.log.info(`Release with version ${versionStr} has been downloaded to ${releaseNode.path}`);
                    this.emit('onReleaseDownloaded', version);
                    if (doInstall) {
                        this.installRelease(version, channel);
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }

    /**
     * @private
     * @function installArchive
     * Unzips a release at the given path
     * @param {string} filePath - the absolute path to the file.
     * @param {string} extractionPath - the name of the folder we unpack everything into.
     * @return {Promise<boolean>}
     */
    installArchive(filePath, extractionPath) {
        return new Promise((resolve, reject) => {
            // the folder which comes out of the zip is named like the zip
            let folderPath = filePath.replace('.zip', '');
            let folderParentPath = path.dirname(folderPath);

            let archive = AdmZip(filePath);
            archive.extractAllToAsync(folderParentPath, true, (done) => {
                fs.rename(folderPath, extractionPath, (done) => {
                    this.log.debug(`Moved folder ${folderPath} to ${extractionPath}`);
                    fs.remove(folderPath, (done) => {
                        resolve(true);
                    });
                });
            });
        });
    }

    /**
     * Installs a release for the given version
     * @function
     * @param {string} versionRange - the semantic version range.
     * @param {string} channelSearch - the release channel.
     * @throws 'Install in progress'
     */
    installRelease(versionRange, channelSearch) {
        let releaseNode = this.getRelease(versionRange, channelSearch);
        if (!releaseNode) {
            this.log.error(`Could not find a release matching '${versionRange}' @ ${channelSearch}. Did you fetch?`);
            return;
        }
        const version = releaseNode.version;
        const channel = releaseNode.channel;
        // This one is here to do the lookup in the maps of installed releases.. key is always version@channel here, even if channel is ''
        const versionStr = `${version}@${channel}`;

        // The release folder however should get named 'version' if channel is '', not 'version@'
        let versionFolderName = version;
        if (channel) {
            versionFolderName = `${version}@${channel}`;
        }

        let installedNode = releaseNode.getChild('isInstalled');

        if (installedNode.get()) {
            this.log.info(`Release ${versionStr} is already installed`);
            return;
        }

        if (this.installing.hasOwnProperty(versionStr) && this.installing[versionStr]) {
            this.log.error(`Installing of release ${versionStr} is already in progress`);
            return;
        }
        this.installing[versionStr] = true;

        this.log.info(`Installing release ${versionStr} started`);

        let zipFilePath = releaseNode.path;

        const installFolder = path.join(this.cacheFolder, versionFolderName);

        this.installArchive(zipFilePath, installFolder).then((done) => {
            try {
                installedNode.set(true);
                this.installing[versionStr] = false;
                releaseNode.path = installFolder;

                this.log.info(`Release with version ${versionStr} has been installed to ${installFolder}`);
                // make the executables executable on Unix
                for (let type of ['server', 'client']) {
                    let executable = path.join(this.getBinaryPath(version, channel), this.getExecutableName(type));
                    fs.chmodSync(executable, 0o755);
                }
                this.emit('onReleaseInstalled', version);
            } catch (e) {
                this.log.error(e);
            }
        });
    }

    /**
     * Uninstalls a release for the given version
     * @function
     * @param {string} versionRange, the semantic version range.
     * @param {string} channelSearch, the release channel.
     */
    uninstallRelease(versionRange, channelSearch) {
        let releaseNode = this.getRelease(versionRange, channelSearch);
        if (!releaseNode) {
            this.log.error(`No release found to uninstall matching '${versionRange}' @ ${channelSearch}`);
            return;
        }
        const version = releaseNode.version;
        const channel = releaseNode.channel;
        const versionStr = `${version}@${channel}`;

        if (this.uninstalling.hasOwnProperty(versionStr) && this.uninstalling[versionStr]) {
            this.log.error(`Uninstalling of release ${versionStr} is already in progress`);
            return;
        }
        this.uninstalling[versionStr] = true;
        let installedNode = releaseNode.getChild('isInstalled');
        const installFolder = releaseNode.getChild('path');

        fs.remove(installFolder, (done) => {
            installedNode.set(false);
            this.uninstalling[versionStr] = false;
            this.log.info(`Uninstalled release with version ${versionStr}`);
            this.emit('onReleaseUninstalled', version);
        });
    }
}

module.exports = ReleaseManager;
