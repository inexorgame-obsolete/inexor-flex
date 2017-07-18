const EventEmitter = require('events');
const process = require('process');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const unzip = require('unzip');
const https = require('follow-redirects').https;

const debuglog = util.debuglog('releases');
const log = require('@inexor-game/logger')()
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');;

const releaseURL = 'https://api.github.com/repos/inexor-game/code/releases';
const userAgent = 'Mozilla/4.0 (compatible; MSIE 5.0b1; Mac_PowerPC)'; // It won't let us use a custom API agent, take IE5 than
const releaseLimit = 5; // How many releases to fetch. TODO: Could be configurable in the future

class ReleaseManager extends EventEmitter {

    /**
     * @constructor
     */
    constructor(applicationContext) {
        super();
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
     * Checks for new releases and exposes them in the tree
     * /releases/$VERSION_NUMBER
     *  - codename (string) - either a code name or the semver
     *  - date (string)
     *  - downloaded (bool)
     *  - installed (bool)
     */
    checkForNewReleases() {
        return new Promise((resolve, reject) => {
            let URL = url.parse(releaseURL)

            https.get({
                host: URL.host,
                path: URL.path,
                headers: {
                    'User-Agent': userAgent
                }
            }, (response) => {
                let body = ''
                response.on('data', (d) => body += d)

                response.on('end', () => {
                    let parsed = JSON.parse(body)
                    resolve(parsed[0])
                })
            })
        })
    }

    insertRelease() {

    }

    downloadRelease() {

    }

    installRelease() {

    }

    uninstallRelease() {

    }
}