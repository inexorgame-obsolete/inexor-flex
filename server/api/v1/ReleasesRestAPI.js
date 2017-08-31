const EventEmitter = require('events');
const util = require('util');

/**
 * REST API for managing releases of Inexor Core.
 */
class ReleasesRestAPI extends EventEmitter {

    /*
     * Constructs the releases REST API
     */
    constructor(applicationContext) {
        super();

        // The express router
        this.router = applicationContext.get('router');

        // The Inexor Tree
        this.root = applicationContext.get('tree');

        // The releases manager
        this.releaseManager = applicationContext.get('releaseManager');

        // The tree node which contains all instance nodes
        this.releasesNode = this.root.getOrCreateNode('releases');

        // List all releases via semver
        this.router.get('/releases', this.listReleases.bind(this));

        // Fetch new releases
        this.router.get('/releases/fetch', this.fetchReleases.bind(this));

        // Save release config
        this.router.get('/releases/save', this.saveReleases.bind(this));

        // Load release config
        this.router.get('/releases/load', this.loadReleases.bind(this));


        // Get infos about a release
        this.router.get('/releases/:version', this.getRelease.bind(this));

        // Download release via semver
        this.router.get('/releases/:version/download', this.downloadRelease.bind(this));

        // Install release via semver
        this.router.get('/releases/:version/install', this.installRelease.bind(this));

        // Uninstall release via semver
        this.router.get('/releases/:version/uninstall', this.uninstallRelease.bind(this));
    }

    /**
     * Sets the dependencies from the application context.
     */
    setDependencies() {
        /// The class logger
        this.log = this.applicationContext.get('logManager').getLogger('flex.api.ReleasesRestAPI');
    }

    /**
     * Initialization after the components in the application context have been
     * constructed.
     */
    afterPropertiesSet() {

    }


    /**
     * Fetches most recent releases
     */
    fetchReleases(req, res) {
        this.log.info('Fetching releases');
        try {
            this.releaseManager.checkForNewReleases();
            res.status(200).send('Fetching latest releases');
        } catch (e) {
            res.status(500).json(e);
        }
    }

    /**
     * Lists all releases
     */
    listReleases(req, res) {
        if (!this.releaseManager.fetching) {
            this.log.info('Listing available releases');
            res.status(200).json(this.releasesNode.getChildNames());
        } else {
            this.log.warn('Fetching releases is in progress. Wait until releases are fetched.');
            res.status(412).send(`New releases are currently fetched. Hang on.`);
        }
    }

    /**
     * Get's a release by version
     * supply the :semver as an argument
     */
    getRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            this.log.info(`Getting release ${req.params.version}`);
            let releaseNode = this.releasesNode.getChild(req.params.version);
            res.status(200).json(releaseNode.toJson());
        } else {
            this.log.warn(`Release with version ${req.params.version} does not exist`);
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    downloadRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let releaseNode = this.releasesNode.getChild(req.params.version);
            let downloadedNode = releaseNode.getChild('downloaded');

            if (!downloadedNode.get() && !this.releaseManager.downloading[req.params.version]) {
                this.log.info(`Downloading release ${req.params.version}`);
                res.status(200).send(`Release with version ${req.params.version} is being downloaded`); // This is asynchronous, listen to WS API
                this.releaseManager.downloadRelease(req.params.version);
            } else {
                res.status(400).send(`Release with version ${req.params.version} has already been downloaded`);
            }
        } else {
            this.log.warn(`Release with version ${req.params.version} does not exist`);
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    installRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let releaseNode = this.releasesNode.getChild(req.params.version);
            let downloadedNode = releaseNode.getChild('downloaded');
            let installedNode = releaseNode.getChild('installed');

            if (downloadedNode.get()) {
                if (!installedNode.get() && !this.releaseManager.installing[req.params.version]) {
                    this.log.info(`Installing release ${req.params.version}`);
                    res.status(200).send(`Release with version ${req.params.version} is being installed`); // This is asynchronous, listen to WS API
                    this.releaseManager.installRelease(req.params.version);
                } else {
                    res.status(400).send(`Release with version ${req.params.version} has already been installed`);
                }
            } else {
                res.status(400).send(`Release with version ${req.params.version} is not downloaded. Download it first!`);
            }
        } else {
            this.log.warn(`Release with version ${req.params.version} does not exist`);
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    uninstallRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let installedNode = this.releaseNode.getChild('installed');

            if (installedNode.get() && !!this.releaseManager.uninstalling[req.params.version]) {
                this.log.info(`Uninstalling release ${req.params.version}`);
                res.status(200).send(`Release with version ${req.params.version} is being uninstalled`); // This is asynchronous, listen to WS API
                this.releaseManager.uninstallRelease(req.params.version);
            } else {
                res.status(400).send(`Release with version ${req.params.version} is not installed`);
            }
        } else {
            this.log.warn(`Release with version ${req.params.version} does not exist`);
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    saveReleases(req, res) {
        this.log.info('Saving release config')
        this.releaseManager.saveReleases().then((done) => {
            res.status(200).send('Saved release config')
        }).catch((err) => {
            res.status(500)
        })
    }

    loadReleases(req, res) {
        this.log.info('Loading release config')
        this.releaseManager.loadReleases().then((done) => {
            res.status(200).send('Loaded release config')
        }).catch((err) => {
            res.status(500).err()
        })
    }
}

module.exports = ReleasesRestAPI;
