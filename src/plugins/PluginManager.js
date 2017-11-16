/**
 * @module plugins
 */

const createSandboxContext = require('./sandbox');
const inexor_path = require('@inexorgame/path');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * @private
 */
const context = createSandboxContext(); // TODO: In the future the list of loadable modules should be configurable via BLACKLIST / WHITELIST system

class PluginManager extends EventEmitter {
    constructor(applicationContext) {
        super();
    }


    /**
     * Sets the dependencies from the application context.
     */
    setDependencies() {
        /// The Inexor Tree root node
        this.root = this.applicationContext.get('tree');

        /// The Inexor Tree node containing plugins
        this.plugins = this.root.getOrCreateNode('plugins');

        /// The log manager service
        this.logManager = this.applicationContext.get('logManager');

        /// The class logger
        this.log = this.logManager.getLogger('flex.console.PluginsManager');

    }

    /**
     * Initialization after the components in the application context have been
     * constructed.
     */
    afterPropertiesSet() {
        // - read all files in the plugin folder
        // - load all .js files
        // - create a plugin node
        // - execute a VM per node
        fs.readdir(inexor_path.plugins_path, (file) => {
            fs.stat(file, (err, stats) => {
                if (err) {
                    this.log.error(`Failed reading the stats for ${file}`)
                } else {
                    if (stats.isFile() && file.endsWith('.js')) {
                        this.log(`Enabled plugin file ${file}`)
                        let pluginName = this.getPluginName(file);
                        let pluginNode = this.plugins.getOrCreateNode(pluginName);
                        pluginNode.addChild('path', 'string', file);
                        this.runPlugin(file);
                    } else {
                        this.log.debug(`Ignoring file ${file} because it is not a plugin file`)
                    }
                }
            })
        })
    }

    /**
     * @private
     */
    getPluginName(file) {
        return path.basename(file).replace('.js', '')
    }

    /**
     * Run's a plugin file (javascript) from the given path
     * @function
     * @param {string} path
     */
    runPlugin(file) {
        fs.readFile(file, (err, data) => {
            if (err) {
                this.log.error(err);
            } else {
                this.log.info(`Loaded plugin file ${file}`);
                vm.runInContext(data, context);
                this.emit('start', `Started plugin file ${file}`);
            }
        })
    }

}

module.exports = PluginManager
