context
-------

This package is vivid for the functionality of Inexor Flex.
It glues together packages with the following flow

- each component has a an `ApplicationContext`
- the `ApplicationContext` is used to register necessary dependencies
- there is a "after initialization" hook, that is used as a asynchronous replacement for the constructor

## Module template
A module using the `ApplicationContext` should look as follows

```
class Module {

    /**
     * @constructor
     */
    constructor(applicationContext) {
        super();

        // Here you can do things like initalizing internal states
        this.initialized = true;
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

        /// The Inexor Tree node containing your module nodes
        this.releaseManagerTreeNode = this.root.getOrCreateNode('module');
    }

    /**
     * Initialization after the components in the application context have been
     * constructed.
     * @function
     */
    afterPropertiesSet() {
        // Do something fancy after the framework has been initalized
    }
}
```