const EventEmitter = require('events');
const express = require('express');
const process = require('process');
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
        this.releaseManager = applicationContext.get('releasesManager');

        // The tree node which contains all instance nodes
        this.releasesNode = this.root.getOrCreateNode('releases');

        // TODO: Pre-populate with existing configs

        // List all releases via semver
        this.router.get('/releases', this.listReleases.bind(this));

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
     * Lists all releases
     */
    listReleases(req, res) {
        res.status(200).json(this.releasesNode.getChildNames());
    }

    /**
     * Get's a release by version
     * supply the :semver as an argument
     */
    getRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let releaseNode = this.releasesNode.getChild(req.params.version);
            res.status(200).json(releaseNode.toJson());
        } else {
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    downloadRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let releaseNode = this.releasesNode.getChild(req.params.version);
            let downloadedNode = releaseNode.getChild('downloaded');

            if (!downloadedNode.get()) {
                res.status(200).send(`Release with version ${req.params.version} is being downloaded`); // This is asynchronous, listen to WS API
                this.releaseManager.downloadRelease(req.params.version);
            } else {
                res.status(400).send(`Release with version ${req.param.id} has already been downloaded`);
            }
        } else {
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    installRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let releaseNode = this.releasesNode.getChild(req.params.version);
            let downloadedNode = releaseNode.getChild('downloaded');
            let installedNode = releaseNode.getChild('installed');

            if (!downloadedNode.get()) {
                if (!installedNode.get()) {
                    res.status(200).send(`Release with version ${req.params.version} is being installed`); // This is asynchronous, listen to WS API
                    this.releaseManager.installRelease(req.params.version);
                } else {
                    res.status(400).send(`Release with version ${req.param.id} has already been installed`);
                }
            } else {
                res.status(400).send(`Release with version ${req.param.id} is not downloaded. Download it first!`);
            }
        } else {
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }

    uninstallRelease(req, res) {
        if (this.releasesNode.hasChild(req.params.version)) {
            let installedNode = releaseNode.getChild('installed');

            if (installedNode.get()) {
                res.status(200).send(`Release with version ${req.params.version} is being uninstalled`); // This is asynchronous, listen to WS API
                this.releaseManager.uninstallRelease(req.params.version);
            } else {
                res.status(400).send(`Release with version ${req.param.id} is not installed`);
            }
        } else {
            res.status(404).send(util.format('Release with version %s was not found', req.params.version));
        }
    }
}