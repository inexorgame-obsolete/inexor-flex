const EventEmitter = require('events');
const process = require('process');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const util = require('util');
const AdmZip = require('adm-zip');
const https = require('follow-redirects').https;

const debuglog = util.debuglog('releases');
const log = require('@inexor-game/logger')();
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');

const releaseURL = 'https://api.github.com/repos/inexor-game/code/releases';
const userAgent = 'Mozilla/4.0 (compatible; MSIE 5.0b1; Mac_PowerPC)'; // It won't let us use a custom API agent, take IE5 than

class ReleaseManager extends EventEmitter {

    /**
     * @constructor
     */
    constructor(applicationContext) {
        super();

        // Hopefully we will support more platforms in the future
        this.platform = '';
        this.platform = inexor_path.determinePlatform();
        this.platform = (this.platform.length === 0) ? 'win64': this.platform; // NOTE: This is a tiny developer hack for unsupported platforms

        // Safe-locks to prevent concurrent tasks
        this.fetching = false;
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
        this.releasesNode = this.root.getOrCreateNode('releases');

        /// The class logger
        this.log = this.applicationContext.get('logManager').getLogger('flex.releases.ReleaseManager');
    }

    /**
     * @private
     * Fetches releases
     * @return {Promise<Object>}
     */
    fetchReleases() {
        return new Promise((resolve, reject) => {
            this.log.info("Fetching latest releases from %s", releaseURL);
            let URL = url.parse(releaseURL);

            https.get({
                host: URL.host,
                path: URL.path,
                headers: {
                    'User-Agent': userAgent
                }
            }, (response) => {
                let body = ''
                response.on('data', (d) => body += d);

                response.on('end', () => {
                    let parsed = JSON.parse(body);
                    debuglog(parsed);
                    resolve(parsed);
                })
            });
        })
    }

    /**
     * @private
     * Inserts a release into the tree
     * @param {string} name - the name of the release
     * @param {string} version - the semantical version of the release
     * @param {string} date - the date of the release
     * @param {Array<Object>} assets - a list of assets attached to that release
     */
    createRelease(name, version, date, assets) {
        if (!this.releasesNode.hasChildren(version)) {
            let releaseNode = this.releasesNode.addNode(version); // Finding releases by semver is more guaranteed to succeed
            releaseNode.addChild('name', 'string', name);
            releaseNode.addChild('version', 'string', version);
            releaseNode.addChild('date', 'string', date);
            releaseNode.addChild('downloaded', 'bool', false);
            releaseNode.addChild('installed', 'bool', false);

            let asset = assets.filter((a) => a.name.includes(this.platform));
            if (asset[0] !== null) {
                releaseNode.addChild('asset', 'node');
                let assetNode = releaseNode.getChild('asset');
                assetNode.addChild('name', 'string', asset[0].name);
                assetNode.addChild('url', 'string', asset[0].browser_download_url);

                this.log.info('A release with version %s has been added', version);
                this.emit('onNewReleaseAvailable', version);
            } else {
                this.log.error(`No release is available for platform ${this.platform} and version ${version}`);
            }
        }
    }

    /**
     * Checks for new releases and exposes them in the tree
     * /releases/$VERSION_NUMBER
     *  - codename (string) - either a code name or the semver
     *  - date (string)
     *  - downloaded (bool)
     *  - installed (bool)
     */
    checkForNewReleases() {
        this.fetching = true;
        this.log.info('Checking for new releases');
        this.fetchReleases().then((releases) => {
            releases.forEach((release) => {
                debuglog(release);
                this.createRelease(release.name, release.tag_name, release.published_at, release.assets);
            })
        })
        this.fetching = false;
    }

    /**
     * @private
     * @function downloadArchive
     * Downloads an archive to a given destination
     * @param  {string} archiveURL
     * @param  {string} fileName
     * @param  {string} destinationPath [destinationPath=process.cwd(] - where the file should go
     * @return {Promise<boolean>}
     */
    downloadArchive(archiveURL, fileName, destinationPath = process.cwd()) {
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
     * @throws "Download in progress"
     */
    downloadRelease(version) {
        if (this.downloading[version]) {
            this.log.error(`Downloading of release ${version} is already in progress`);
        } else {
            this.downloading[version] = true;
            let releaseNode = this.releasesNode.getChild(version);
            let assetNode = releaseNode.getChild('asset');
            let urlNode = assetNode.getChild('url');
            let nameNode = assetNode.getChild('name');
            let downloadNode = releaseNode.getChild('downloaded');

            try {
                this.downloadArchive(urlNode.get(), nameNode.get()).then((done) => {
                    downloadNode.set(true);
                    this.downloading[version] = false;
                    this.log.info('Release with version %s has been downloaded', version);
                    this.emit('onReleaseDownloaded', version);
                })
            } catch (e) {
                this.log.error(e);
            }
        }
    }

    /**
     * @private
     * @function installArchive
     * Unzips a release at the given path
     * @param {fileName} fileName
     * @param {extractionPath} path
     * @return {Promise<boolean>}
     */
    installArchive(fileName, extractionPath=process.cwd()) {
        return new Promise((resolve, reject) => {
            let filePath = path.join(extractionPath, fileName);
            let folderPath = path.join(extractionPath, fileName.replace('.zip', ''));
            let folderName = fileName.replace('.zip', '/bin/');
            debuglog(folderName);
            let archive = AdmZip(filePath);

            archive.extractEntryTo(folderName, extractionPath, true); // Ugh, synchronous
            fs.rename(path.join(folderPath, 'bin'), path.join(extractionPath, 'bin'), (done) => {
                fs.unlink(folderPath);
                resolve(true);
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
        } else {
            this.installing[version] = true;
            let releaseNode = this.releasesNode.getChild(version);
            let assetNode = releaseNode.getChild('asset');
            let nameNode = assetNode.getChild('name');
            let installedNode = releaseNode.getChild('installed');

            this.installArchive(nameNode.get()).then((done) => {
                try {
                    installedNode.set(true);
                    this.installing[version] = false;
                    this.log.info('Release with version %s has been installed', version);
                    this.emit('onReleaseInstalled', version);
                } catch (e) {
                    this.log.error(e);
                }
            })
        }
    }

    /**
     * Uninstalls a release for the given version
     * @param {string} version
     */
    uninstallRelease(version) {
        if (this.uninstalling[version]) {
            this.log.error(`Uninstalling of release ${version} is already in progress`);
        } else {
            this.uninstalling[version] = true;
            let releaseNode = this.releasesNode.getChild(version);
            let assetNode = releaseNode.getChild('asset');
            let installedNode = assetNode.getChild('installed');

            // TODO: Clean this up
            let binaryPath = path.join(process.cwd(), 'bin');
            fs.unlink(binaryPath, (done) => {
                installedNode.set(false);
                this.uninstalling[version] = false;
                this.log.info("Uninstalled release with version %s", version)
                this.emit('onReleaseUninstalled', version);
            })
        }
    }
}

module.exports = ReleaseManager;
