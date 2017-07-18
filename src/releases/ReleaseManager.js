const EventEmitter = require('events');
const process = require('process');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const util = require('util');
const unzip = require('unzip');
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
        this.platform (!this.platform) ? 'win64': this.platform; // NOTE: This is a tiny developer hack for unsupported platforms
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
        this.log = this.applicationContext.get('logManager').getLogger('flex.interfaces.ReleaseManager');

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
        if (!this.releasesNode.contains(version)) {
            let releaseNode = this.releasesNode.addNode(version); // Finding releases by semver is more guaranteed to succeed
            releaseNode.addChild('name', 'string', name);
            releaseNode.addChild('version', 'string', version);
            releaseNode.addChild('date', 'string', date);
            releaseNode.addChild('downloaded', 'boolean', false);
            releaseNode.addChild('installed', 'boolean', false);

            let asset = assets.filter((a) => a.name.includes(this.platform));
            releaseNode.addChild('asset', 'node');
            let assetNode = releaseNode.getChild('asset');
            assetNode.addChild('name', 'string', asset.url);
            assetNode.addChild('url', 'string', asset.url);

            this.log.info('A release with version %s has been added', version);
            this.emit('onNewReleaseAvailable', version);
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
        this.fetchReleases().then((releases) => {
            for (release in releases) {
                this.createRelease(release.name, release.tag_name, release.published_at, release.assets);
            }
        })
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
     */
    downloadRelease(version) {
        let releaseNode = this.releasesNode.getChild(version);
        let assetNode = releaseNode.getNode('asset');
        let urlNode = assetNode.getChild('url');
        let nameNode = assetNode.getChild('name');

        try {
            this.downloadArchive(urlNode.get(), nameNode.get()).then((done) => {
                this.releasesNode.getChild('downloaded').set(true);
                this.log.info('Release with version %s has been downloaded', version);
                this.emit('onReleaseDownloaded', version);
            })
        } catch (e) {
            this.log.error(e);
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
    installArchive(fileName, extractionPath=process.getcwd()) {
        return new Promise((resolve, reject) => {
            let filePath = path.join(extractionPath, fileName);
            let fileStream = fs.createReadStream(filePath)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    let tempfileName = entry.path;
                    let type = entry.type; // 'Directory' or 'File'
                    let size = entry.size;

                    if (tempfileName === "this IS the file I'm looking for") {
                        entry.pipe(fs.createWriteStream('output/path'));
                    } else {
                        entry.autodrain();
                    }

            })

            resolve(true);
        })
    }

    /**
     * Installs a release for the given version
     * @param {string} version
     */
    installRelease(version) {
        let releaseNode = this.releasesNode.getChild(version);
        let assetNode = releaseNode.getChild('asset');
        let nameNode = assetNode.getChild('name');

        this.installArchive(nameNode.get()).then((done) => {
            try {
                this.releasesNode.getChild('installed').set(true);
                this.log.info('Release with version %s has been installed', version);
                this.emit('onReleaseInstalled', version);
            } catch (e) {
                this.log.error(e);
            }
        })
    }

    /**
     * Uninstalls a release for the given version
     * @param {string} version
     */
    uninstallRelease(version) {
        let releaseNode = this.releasesNode.getChild(version);
        let assetNode = releaseNode.getChild('asset');
        let nameNode = assetNode.getChild('name');

        let filePath = path.join(process.getCwd(), name);
        fs.unlink(filePath, (done) => {
            this.log.info("Uninstalled release with version %s", version)
            this.emit('onReleaseUninstalled', version);
        })
    }
}