const EventEmitter = require('events');

/**
 * REST API for managing releases of Inexor Core.
 * @module api
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
        this.releaseManagerTreeNode = this.root.getOrCreateNode('releases');
        this.releaseChannelsTreeNode = this.releaseManagerTreeNode.getOrCreateNode('channels');
        this.releaseprovidersTreeNode = this.releaseManagerTreeNode.getOrCreateNode('release_providers');

        // List all releases via semver
        this.router.get('/releases', this.listReleases.bind(this));

        // Fetch new releases
        // NOTE: This is not needed manually anymore
        this.router.get('/releases/fetch', this.fetchReleases.bind(this));

        // Load release config
        this.router.get('/releases/load', this.loadReleases.bind(this));

        // Get infos about a release
        this.router.get('/releases/info/:versionRange/:channelSearch', this.getReleaseInfo.bind(this));

        // Download release via semver
        this.router.get('/releases/download/:versionRange/:channelSearch', this.downloadRelease.bind(this));

        // Install release via semver
        this.router.get('/releases/install/:versionRange/:channelSearch', this.installRelease.bind(this));

        // Uninstall release via semver
        this.router.get('/releases/uninstall/:versionRange/:channelSearch', this.uninstallRelease.bind(this));
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
            res.status(200).json(this.releaseChannelsTreeNode.toJson());
        } else {
            this.log.warn('Fetching releases is in progress. Wait until releases are fetched.');
            res.status(412).send(`New releases are currently fetched. Hang on.`);
        }
    }

    /**
     * Get's a release info by semantic version range and release channel
     * supply the :semver as an argument
     */
    getReleaseInfo(req, res) {
        let releaseNode = this.releaseManager.getRelease(req.params.versionRange, req.params.channelSearch);
        if (!releaseNode) {
            let errmsg = `Release of version range ${req.params.versionRange} in channel ${req.params.channelSearch} does not exist`;
            this.log.warn(errmsg);
            res.status(404).send(errmsg);
            return
        }

        this.log.info(`Getting release ${releaseNode.version}@${releaseNode.channel}`);
        res.status(200).json(releaseNode.toJson());
    }

    downloadRelease(req, res) {
        let releaseNode = this.releaseManager.getRelease(req.params.versionRange, req.params.channelSearch);
        if (!releaseNode) {
            let errmsg = `Release with version ${req.params.versionRange}@${req.params.channelSearch} does not exist`;
            this.log.warn(errmsg);
            res.status(404).send(errmsg);
            return
        }
        const version_str = `${releaseNode.version}@${releaseNode.channel}`;
        let downloadedNode = releaseNode.getChild('isDownloaded');

        if (downloadedNode.get() || this.releaseManager.downloading[version_str]) {
            res.status(400).send(`Release with version ${version_str} has already been downloaded`);
            return;
        }
        this.log.info(`Downloading release ${version_str}`);
        res.status(200).send(`Release with version ${version_str} is being downloaded`); // This is asynchronous, listen to WS API
        this.releaseManager.downloadRelease(releaseNode.version, releaseNode.channel);
    }

    installRelease(req, res) {
        let releaseNode = this.releaseManager.getRelease(req.params.versionRange, req.params.channelSearch);
        if (!releaseNode) {
            let errmsg = `Release with version ${req.params.versionRange}@${req.params.channelSearch} does not exist`;
            this.log.warn(errmsg);
            res.status(404).send(errmsg);
            return
        }
        const version_str = `${releaseNode.version}@${releaseNode.channel}`;

        let downloadedNode = releaseNode.getChild('isDownloaded');
        let installedNode = releaseNode.getChild('isInstalled');

        if (!downloadedNode.get()) {
            res.status(400).send(`Release with version ${version_str} is not downloaded. Download it first!`);
            return
        }
        if (installedNode.get() || this.releaseManager.installing[version_str]) {
            res.status(400).send(`Release with version ${version_str} has already been installed (or is installing)`);
            return
        }
        this.log.info(`Installing release ${version_str}`);
        res.status(200).send(`Release with version ${version_str} is getting installed`); // This is asynchronous, listen to WS API
        this.releaseManager.installRelease(releaseNode.version, releaseNode.channel);
    }

    uninstallRelease(req, res) {
        let releaseNode = this.releaseManager.getRelease(req.params.versionRange, req.params.channelSearch);
        if (!releaseNode) {
            let errmsg = `Release with version ${req.params.versionRange}@${req.params.channelSearch} does not exist`;
            this.log.warn(errmsg);
            res.status(404).send(errmsg);
            return
        }
        const version_str = `${releaseNode.version}@${releaseNode.channel}`;
        let installedNode = this.releaseNode.getChild('isInstalled');

        if (installedNode.get() && !this.releaseManager.uninstalling[version_str]) {
            this.log.info(`Uninstalling release ${version_str}`);
            res.status(200).send(`Release with version ${version_str} is being uninstalled`); // This is asynchronous, listen to WS API
            this.releaseManager.uninstallRelease(releaseNode.version, releaseNode.channel);
        } else {
            res.status(400).send(`Release with version ${version_str} is not installed`);
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
