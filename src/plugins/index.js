const vm = require('vm')
const path = require('path')
const treeclient = require('@inexorgame/treeclient')
const EventEmitter = require('events').EventEmitter

/**
 * The plugin manager manages all the plugins
 */
class PluginManager extends EventEmitter {
    /**
     * @constructor
     */
    constructor(applicationContext) {
        super()

        this.plugins = [] // [path of plugin]
    }

    /*
     * Sets the required dependencies
     */
    setDependencies() {
        /// The Inexor Tree root node
        this.root = this.applicationContext.get('tree');

        /// The Inexor Tree node containing instances
        this.pluginsNode = this.root.getOrCreateNode('plugins');

        /// The console manager service
        this.logManager = this.applicationContext.get('logManager');

        /// The class logger
        this.log = this.logManager.getLogger('flex.plugins.PluginManager');
    }

    /**
     * Initialization after the components in the application context have been
     * constructed.
     */
    afterPropertiesSet() {

    }

    /**
     * Loads all the plugins available in the plugin directory
     */
    loadPlugins() {
        // Add a standard path for plugins under user data directory .join(data_dir, 'plugins') in @inexorgame/path
        // List all modules (folders) via path.scanFolder
        // if not in TOML/config exclude, add to plugins list
        // Execute enablePlugin for plugin path

    }

    /**
     * Enables a plugin by creating a VM context for it
     * @function
     * @param {string} path - the path to the plugin file to load
     */
    enablePlugin(path) {
        // Create a VM context
        // Inject the treeclient globally because it's usefull
        // Load the script into the context
        // In the future additional security measurements may be taken

    }

    // Additional stuff
    // - add introduction and example plugin
    // - add simple API endpoint to add and list plugins
    // - add command line for it
}

module.exports = PluginManager
