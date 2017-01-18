/**
 * @module context
 * Provides an application context.
 */

class ApplicationContext {

  constructor() {
    this.components = {};
  }

  construct(name, factory) {
    var component = factory();
    this.register(name, component);
    return component;
  }

  register(name, component) {
    component.application_context = this;
    this.components[name] = component;
  }

  unregister(name) {
    delete this.components[name];
  }

  get(name) {
    return this.components[name];
  }

}

module.exports = {
  ApplicationContext: ApplicationContext
}
