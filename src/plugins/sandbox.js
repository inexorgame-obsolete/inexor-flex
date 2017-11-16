const vm = require('vm');
const treeclient = require('@inexorgame/treeclient');

/**
 * @module plugins
 */

/**
 * Lists which modules can be safely required
 * @property WHITELISTED_MODULES
 * @type {Array<string>}
 */
const WHITELISTED_MODULES = ['@inexorgame/treeclient', '@inexorgame/logger'] // TODO: in the future only blacklisted modules should be included

/**
 * Creates a sandbox with listed modules allowed
 * @function createSandbox
 */
const createSandboxContext = (modules) => {
    modules = WHITELISTED_MODULES.concat(modules);

    let sandbox = {
        treeclient: treeclient,
        require: (module) => {
            "use strict";
            if (modules.includes(module)) {
                return require.apply(this, arguments);
            } else {
                throw Error(`Trying to access module ${module} which is not one of ${modules}`)
            }
        }
    }

    return vm.createContext(sandbox);
}

module.exports = createSandboxContext
