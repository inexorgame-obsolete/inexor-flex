/**
 * The application context.
 * @module context
 */

class ApplicationContext {

  constructor() {
    this.components = {};
    this.dependenciesSet = {};
    this.propertiesSet = {};
  }

  construct(name, factory) {
    var component = factory();
    return this.register(name, component);
  }

  /**
   * Registers a component
   * @param name {string}
   * @param component {mixed}
   * @returns {mixed}
   */
  register(name, component) {
    component.applicationContext = this;
    this.components[name] = component;
    this.dependenciesSet[name] = false;
    this.propertiesSet[name] = false;
    return component;
  }

  /**
   * Unregisters a component
   * @param name {string}
   */
  unregister(name) {
    if (name in this.components)
      delete this.components[name];
  }

  get(name) {
    if (name in this.components) {
      return this.components[name];
    } else {
      throw `Component ${name} is not defined`
    }
  }

  set(name, value) {
    if (name in this.components) {
      this.components[name] = value;
      return this.components[name];
    } else {
      throw `Component ${name} is not defined`
    }
  }

  /**
   * Calls the setDependencies() method of each component in the
   * application context.
   */
  setDependencies() {
    for (let name of Object.keys(this.components)) {
      if (this.components.hasOwnProperty(name)) {
        if (this.components[name].setDependencies && !this.dependenciesSet[name]) {
          this.components[name].setDependencies();
        }
      }
    }
  }

  /**
   * Calls the afterPropertiesSet() method of each component in the
   * application context.
   */
  afterPropertiesSet() {
    for (let name of Object.keys(this.components)) {
      if (this.components.hasOwnProperty(name)) {
        if (this.components[name].afterPropertiesSet && !this.propertiesSet[name]) {
          this.components[name].afterPropertiesSet();
        }
      }
    }
  }

  beforeDestroy() {
    for (let name of Object.keys(this.components)) {
      if (this.components.hasOwnProperty(name)) {
        if (this.components[name].beforeDestroy) {
          this.components[name].beforeDestroy();
        }
      }
    }
  }

  destroy() {
    for (let name of Object.keys(this.components)) {
      if (this.components.hasOwnProperty(name)) {
        delete this.components[name];
        delete this.dependenciesSet[name];
        delete this.propertiesSet[name];
      }
    }
  }

}

module.exports = {
  ApplicationContext: ApplicationContext
}
