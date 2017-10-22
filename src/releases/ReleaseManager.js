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

/* whats missing?
- releases always need to get fetched, but its not clear which one are already downloaded.
- download + install should be doable in one step
- instance should have a "version" field
- resolve_version(semantic_version_str) -> real version
- maybe rename pakete zu inexor-core-only-{windows/linux/darwin}-{32/64}-alpha.zip
*/

class ReleaseManager extends EventEmitter {

    /**
     * @constructor
     */
    constructor(applicationContext) {
        super();

        // Hopefully we will support more platforms in the future
        this.platform = '';
        this.platform = this.determinePlatform();
        this.platform = (this.platform.length === 0) ? 'win64' : this.platform; // NOTE: This is a tiny developer hack for unsupported platforms

        // The provider which acts as local cache. needs to be of type filesystem
        this.cache_folder = "";
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
        this.releaseManagerTreeNode = this.root.getOrCreateNode('release');
        this.releasesTreeNode = this.releaseManagerTreeNode.getOrCreateNode('versions');
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
            this.log.debug(`Checking whether the releases directory exists at ${this.cache_folder}`)
            fs.mkdir(this.cache_folder, (err) => {
                if (!err)
                    this.log.info(`Created releases directory at ${this.cache_folder}`)
                else if (err.code !== 'EEXIST')
                    this.log.error(err)
            })
            this.checkForNewReleases()
        });
    }

    /**
     * @property
     * Is any of the providers currently fetching?
     */
    get fetching() {
        let providersobj = this.releaseprovidersTreeNode.toObject();
        for (let name of Object.keys(providersobj)) {
            if (providersobj[name]["isfetching"] == true) return true;
        }
        return false;
    }

    /**
     * Returns the path of the releases.toml.
     * @function
     * @param {string} [filename] - The filename.
     * @return {string} - The path to the configuration file.
     */
    getConfigPath(filename = "releases.toml") {
        let config_paths = inexor_path.getConfigPaths();
        for (var i = 0; i < config_paths.length; i++) {
            var config_path = path.join(config_paths[i], filename);
            if (fs.existsSync(config_path)) {
                return config_path;
            }
        }
        return filename;
    }

    /**
     * @function
     * Determines the platform name as uploaded by Travis currently
     * NOTE: Keep this up-to date!
     * @return {string} - "{Windows|Linux|Darwin}{32|64}" first is the CMAKE_SYSTEM_NAME, then 32 or 64
     */
    determinePlatform() {
        let platform = ''
        if (os.platform() == 'win32') {
            platform += 'Windows'
        } else if (os.platform() == 'linux') {
            platform += 'Linux'
        } else if (os.platform() == 'darwin') {
            platform += 'Darwin'
        }

        if (['arm64', 'x64'].includes(os.arch())) {
            platform += '64'
        } else {
            platform += '32'
        }

        return platform
    }

    /**
     * @function
     * Get Version from the Zip file name uploaded by Travis/Appveyor currently.
     * Returns 0.8.10 from Inexor-0.8.10-alpha-Linux.zip
     * valid input is everything fulfilling the pattern Inexor-<characters>-<this.platform><characters> (so also non-zips)
     * @param {string} name - the input string.
     * @return {string} - the version or "" if pattern isn't matched
     */
    getVersionFromZipName(name) {
        const version_start_index = 12; // inexor-core-
        const version_end_index = name.indexOf(`-${this.platform}`);  // Gets the index where the platform occurs
        if (version_end_index == -1 || version_end_index < 13)
            return ""
        return name.substring(version_start_index, version_end_index);
    }

    /**
     * @function
     * Get the Zip file name uploaded by Travis/Appveyor currently.
     * Returns inexor-core-0.8.10-alpha-Linux32.zip if you give it the version 0.8.10-alpha.
     *
     * @param {string} version - the input string.
     * @return {string} - inexor-core-<version>-<this.platform>.zip
     */
    makeZipNamefromVersion(version) {
        return `inexor-core-${version}-${this.platform}.zip`;
    }

    /**
     * @function
     * Return the bin folder path of a version.
     *
     * @param {string} version - the input string.
     * @return {string} - the binary folder of the specific version or ""
     */
    getBinaryPath(version) {
        const releaseNode = this.releasesTreeNode.getChild(version);
        if (!releaseNode) {
            this.log.error(`Could not find binary path for non-existent version ${version}`)
            return ""
        }

        const providerName = releaseNode.getChild("provider");
        const providerNode = this.releaseprovidersTreeNode.getChild(providerName.toString());

        let binaryPath = path.join(this.cache_folder, version);

        if (providerNode && providerNode["type"] == "filesystem") {
            binaryPath = path.join(providerNode["path"], version);
        }

        return binaryPath;
    }


    /**
     * Returns the Name of the executable given its instance type.
     * @function
     * @param {string} instance_type - either client or server: the InexorCore gameserver or gameclient.
     * @return {string} - inexor-core-${instance_type}.exe (on all platforms)
     */
    getExecutableName(instance_type) {
        return `inexor-core-${instance_type}.exe`;
    }

    /**
     * Loads releases from a TOML file.
     * @function
     * @param {string} [filename] - The filename.
     * @return {Promise<bool|string>} - either true or the error reason
     */
    loadConfig(filename = 'releases.toml') {
        return new Promise((resolve, reject) => {
            let config_path = this.getConfigPath(filename);
            this.log.info(`Loading release config from ${config_path}`);
            fs.readFile(config_path, ((err, data) => {
                if (err) {
                    this.log.error(`Failed to load releases config from ${config_path}: ${err.message}`);
                    reject(`Failed to load releases config from ${config_path}: ${err.message}`);
                    return
                }
                let config = ""
                try {
                    config = toml.parse(data.toString());
                } catch (e) {
                    let errormsg = `Error parsing ${config_path} on line ${e.line}, column ${e.column}: ${e.message}`
                    this.log.error(errormsg);
                    reject(errormsg);
                    return
                }
                this.log.info(config);

                if (config.releases["explicit_release_folders"]) {
                    for (let i = 0; i < config.releases.explicit_release_folders.length; i++) {
                        // we say the version name is the folder.
                        let fullpath = config.releases.explicit_release_folders[i];
                        let version_name = path.basename(fullpath); // the last folder
                        this.addRelease(version_name, fullpath, true, true, version_name, "explicit_path");
                    }
                }

                for (let name of Object.keys(config.releases.provider)) {
                    let providerNode = config.releases.provider[name];
                    let needsunpacking = providerNode.needsunpacking == true;
                    this.addProvider(providerNode.name, providerNode.type, providerNode.path, needsunpacking);
                }

                let cache_folder_provider = config.releases["cache_provider"];

                // if no cache_folder_provider entry exists, fall back to using the last provider with type filesystem.
                // if none exist: reject
                if (!cache_folder_provider) {
                    let providers_obj = this.releaseprovidersTreeNode.toObject();
                    for (let name of Object.keys(providers_obj)) {
                        if (providers_obj[name].type == "filesystem") {
                            this.cache_folder = providers_obj[name].path;
                            resolve(true);
                            return;
                        }
                    }
                    const errmsg = `There was neither a cache_folder entry nor any release providers of type filesystem in your ${config_path}`
                    this.log.error(errmsg);
                    reject(false);
                    return;
                }
                if (!this.releaseprovidersTreeNode.hasChild(cache_folder_provider)) {
                    this.log.error(`Cache folder provider error in ${config_path}: provider with name ${cache_folder_provider} does not exists`);
                    reject(false);
                    return
                }
                this.cache_folder = this.releaseprovidersTreeNode.getChild(cache_folder_provider)["path"]
                this.log.info(`Using the provider ${cache_folder_provider} as cache folder (${this.cache_folder})`);

                resolve(true);

            }))

        })
    }

    /**
     * Saves release to a TOML file. Currently doing nothing!
     * @function
     * @param {string} [filename] - The filename.
     * @return {Promise<bool|string>} - either true or the error reason
     */
    saveConfig(filename = "releases.toml") {
        return new Promise((resolve, reject) => {
            this.log.warn(`Saving ${filename} is currently not supported.`);
            reject(`Failed to write releases to ${filename}: not supported atm.`);
        });
    }

    /**
     * @private
     * Scans folder for subfolders.
     * @param {Object} provider
     * @return {Promise<bool>}
     */
    fetchfromFilesystemProvider(provider) {
        return new Promise((resolve, reject) => {
            var absolute_path = provider["path"];
            this.log.info(`Starting to scan folder ${absolute_path}`);
            fs.readdir(absolute_path, (err, items) => {
                if (err) {
                    this.log.error(`Failed to scan folder ${absolute_path} for subfolders: ${err}`);
                    reject(false)
                }

                for (let item of items) {
                    let fullpath = path.join(absolute_path, item);
                    let isfolder = fs.statSync(fullpath).isDirectory()
                    // add all subfolders as releases
                    if (isfolder) {
                        this.addRelease(item, fullpath, true, true, item, provider["name"]);
                        continue;
                    }
                    // add all zips which have the right name as not-installed releases
                    let iszip = path.extname(item) == ".zip";
                    if (iszip) {
                        let version = this.getVersionFromZipName(item);
                        this.addRelease(version, fullpath, true, false, version, provider["name"]);
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
    fetchfromRestProvider(provider) {
        const path = provider["path"];
        let isfetchingNode = provider["isfetching"];

        let promise = new Promise((resolve, reject) => {

            if (isfetchingNode == true) {
                this.log.error(`Already fetching latest releases from  ${path} (provider:${provider["name"]})`);
                reject(false);
            }
            isfetchingNode = true;
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
                        isfetchingNode = false;

                        for (let release of parsed) {
                            debuglog(release);

                            // find asset path for our platform from json
                            let asset = release.assets.filter((a) => {
                                if (a.content_type != "application/zip")
                                    return false;
                                return a.name.includes(this.platform);
                            });
                            if (asset[0] != null) {
                                this.addRelease(release.tag_name, asset[0].browser_download_url, false, false, release.name, provider["name"]);
                            }
                        }

                        resolve(true)
                    })
                }
            )
        });
        return promise;
    }

    /**
     * @private
     * Fetches releases from the providers.
     * @return {Promise<bool>}
     */
    fetchReleases() {
        let promises = []
        let providers = this.releaseprovidersTreeNode.toObject();
        for (let i of Object.keys(providers)) {
            let provider_obj = providers[i];
            this.log.info(`Fetching from ${provider_obj["name"]}`);

            if (provider_obj["type"] == "filesystem")
                promises.push(this.fetchfromFilesystemProvider(provider_obj));
            else
                promises.push(this.fetchfromRestProvider(provider_obj));
        }
        // we now have a promises array and return it a single promise which resolves when all promises inside are.
        return Promise.all(promises);
    }

    /**
     * @private
     * Inserts a release into the tree (a virtual one on a remote server, or a filesystem one).
     * If the release already exists, it returns.
     * @param {string} version - the semantical version of the release (+ possible usage of @channel, i.e. 0.1.1@stable
     * @param {string} path - the filepath to the release on the harddisk or online.
     * @param {bool} isdownloaded - if the release is already on the harddisk.
     * @param {bool} isinstalled - if the release is a zip or already a directory.
     * @param {string} name - optional name for the release.
     * @param {string} provider - the provider name, where the release is currently.
     */
    addRelease(version, path, isdownloaded = false, isinstalled = false, name = "", provider = "explicit_path") {
        if (this.releasesTreeNode.hasChild(version)) {
            let old_was_downloaded = this.releasesTreeNode.getChild('isdownloaded').get();
            let old_was_installed = this.releasesTreeNode.getChild('isinstalled').get();

            if ((isinstalled && !old_was_installed) || (isdownloaded && !old_was_downloaded)) {
                // this release is actually "better" than the saved one (its downloaded/installed already)
                let oldreleaseNode = this.releasesTreeNode[version];
                oldreleaseNode['path'] = path;
                if (name.length(name)) oldreleaseNode['name'] = name;
                oldreleaseNode['provider'] = provider;
                oldreleaseNode['isdownloaded'] = isdownloaded;
                oldreleaseNode['isinstalled'] = isinstalled;
            }
            return
        }
        let releaseNode = this.releasesTreeNode.addNode(version);
        releaseNode.addChild('version', 'string', version);
        releaseNode.addChild('path', 'string', path);
        releaseNode.addChild('name', 'string', name);
        releaseNode.addChild('provider', 'string', provider);
        releaseNode.addChild('isdownloaded', 'bool', isdownloaded);
        releaseNode.addChild('isinstalled', 'bool', isinstalled);

        this.emit('onNewReleaseAvailable', version);
        this.log.info(`A release with version ${version} has been added (provider: ${provider})`);
    }

    /**
     * @private
     * Inserts a release provider into the tree.
     * If the name is already in the tree, error and return.
     * @param {string} name - the unique identifier for this provider
     * @param {string} type - either "filesystem" or "REST" (case insensitive)
     * @param {string} provider_path - either the URL or path on the filesystem (absolute or relative to path.AppdataLocation[0])
     * @param {string} needsunpacking - does the provider provide zips or folders?
     */
    addProvider(name, type, provider_path, needsunpacking = false) {
        if (this.releaseprovidersTreeNode.hasChild(name)) {

            this.log.warn(`A release provider with name ${name} already exists`);
            return;
        }
        const lower_case_type = type.toLowerCase();
        if (lower_case_type != "filesystem" && lower_case_type != "rest") {
            this.log.error(`The release provider ${name} is of unknown type ${type} (supported: rest and filesystem)`);
            return;
        }
        let absolute_path = provider_path;
        if (lower_case_type == "filesystem") {
            absolute_path = path.isAbsolute(provider_path) ? provider_path : path.join(inexor_path.releases_path, provider_path);
        }
        //  this.log.warn(`Len before: ${Object(this.releaseprovidersTreeNode).keys.length}`)
        let providerNode = this.releaseprovidersTreeNode.addNode(name);
        providerNode.addChild('name', 'string', name);
        providerNode.addChild('type', 'string', lower_case_type);
        providerNode.addChild('path', 'string', absolute_path);
        providerNode.addChild('needsunpacking', 'bool', needsunpacking);
        providerNode.addChild('isfetching', 'bool', false);

        this.log.info(`Release provider ${name} has been added`);
        this.emit('onNewProviderAvailable', name);
    }

    /**
     * Checks for new releases and exposes them in the tree
     * /releases/$VERSION_NUMBER
     *  - version (string) - either a code name or the semver
     *  - name (string) - an optional release name
     *  - path (string) - the path to the version
     *  - isdownloaded (bool)
     *  - isinstalled (bool) - whether or not the zip files are already unpacked.
     * @function
     * @return {Promise<bool>} - have a look at {link ReleaseManager.fetchReleases}
     */
    checkForNewReleases() {
        const vm = this;
        return new Promise((resolve, reject) => {
            vm.log.info('Checking for new releases');
            resolve(vm.fetchReleases());
        })
    }

    /**
     * @private
     * @function downloadArchive
     * Downloads an archive to a given destination
     * @param  {string} archiveURL
     * @param  {string} fileName
     * @param  {string} destinationPath - where the file should go
     * @return {Promise<boolean>}
     */
    downloadArchive(archiveURL, fileName, destinationPath) {
        return new Promise((resolve, reject) => {
            let URL = url.parse(archiveURL)
            let filePath = path.resolve(destinationPath, fileName)
            let file = fs.createWriteStream(filePath)

            https.get({
                host: URL.host,
                path: URL.path,
                headers: {
                    'User-Agent': userAgent
                }
            }, (response) => {
                response.pipe(file)

                response.on('end', () => {
                    file.close()
                    resolve(true)
                })
            })

        })
    }

    /**
     * Downloads a release for the specific version
     * @param {string} version
     * @param {bool} doinstall
     */
    downloadRelease(version, doinstall = true) {
        if (this.downloading[version]) {
            this.log.error(`Downloading of release ${version} is already in progress`);
            return;
        }
        let releaseNode = this.releasesTreeNode.getChild(version);

        if (!releaseNode) {
            this.log.error(`There is no ${version}. Did you fetch?`);
            return;
        }
        this.downloading[version] = true;

        // releaseNode.getChild('version', 'string', version);
        // releaseNode.getChild('name', 'string', name);
        let isdownloadedNode = releaseNode.getChild('isdownloaded'); // The TreeNode on a bool
        const isinstalled = releaseNode.getChild('isinstalled').get(); // a bool

        try {
            // its already downloaded but not yet downloaded.
            if (isdownloadedNode.get() && !isinstalled && doinstall) {
                this.installRelease(version);
                return
            }

            // only REST providers come here

            const urlNode = releaseNode.getChild('path');
            const zipfilename = this.makeZipNamefromVersion(version);

            this.downloadArchive(urlNode.get(), zipfilename, this.cache_folder).then((done) => {
                isdownloadedNode.set(true);
                this.downloading[version] = false;
                this.log.info(`Release with version ${version} has been downloaded`);
                this.emit('onReleaseDownloaded', version);
                if (doinstall) {
                    this.installRelease(version);
                }
            })
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
                    this.log.debug(`Moved folder ${folderPath} to ${extractionPath})`);
                    fs.remove(folderPath, (done) => {
                        resolve(true);
                    })
                })
            })
        })
    }

    /**
     * Installs a release for the given version
     * @param {string} version
     * @throws "Install in progress"
     */
    installRelease(version) {
        if (this.installing[version]) {
            this.log.error(`Installing of release ${version} is already in progress`);
            return;
        }
        this.installing[version] = true;
        let releaseNode = this.releasesTreeNode[version];
        let installedNode = releaseNode.getChild('isinstalled');

        if (installedNode.get()) {
            this.log.info(`Release ${version} is already installed`);
            return;
        }

        this.log.info(`Installing release ${version} started`);

        const providerName = releaseNode.getChild("provider");
        const providerNode = this.releaseprovidersTreeNode.getChild(providerName.toString());


        const zipName = this.makeZipNamefromVersion(version);
        let zipFilePath = path.join(this.cache_folder, zipName);

        if (providerNode && providerNode["type"] == "filesystem") {
            zipFilePath = path.join(providerNode["path"], zipName);
        }

        const installFolder = path.join(this.cache_folder, version);

        this.installArchive(zipFilePath, installFolder).then((done) => {
            try {
                for (let type in ["server", "client"]) {
                    let executable = path.join(this.getBinaryPath(version), this.getExecutableName(type));
                    fs.chmodSync(executable, 0o755);
                }
                installedNode.set(true);
                this.installing[version] = false;
                this.log.info(`Release with version ${version} has been installed`);
                this.emit('onReleaseInstalled', version);
            } catch (e) {
                this.log.error(e);
            }
        })
    }

    /**
     * Installs the latest release. Optionally specify a channel
     * TODO: Add tag support
     * @function
     */
    installLatest() {
        let releases = this.releasesTreeNode.getChildNames();

        releases = releases.sort(semver.compare) // Sort according to semver
        let releaseNode = this.releasesTreeNode[releases[0]];

        this.downloadRelease(releaseNode.version);
    }

    /**
     * Uninstalls a release for the given version
     * @param {string} version
     */
    uninstallRelease(version) {
        if (this.uninstalling[version]) {
            this.log.error(`Uninstalling of release ${version} is already in progress`);
            return
        }
        this.uninstalling[version] = true;
        let releaseNode = this.releasesTreeNode.getChild(version);
        let installedNode = releaseNode.getChild('isinstalled');
        const installFolder = path.join(this.cache_folder, version);
        // TODO: remove zip file if downloaded.
        fs.remove(installFolder, (done) => {
            installedNode.set(false);
            this.uninstalling[version] = false;
            this.log.info(`Uninstalled release with version ${version}`)
            this.emit('onReleaseUninstalled', version);
        })
    }
}

module.exports = ReleaseManager;
