/**
 * The application context.
 * @module context
 */

class ApplicationContext {

  constructor() {
    this.components = {};
  }

  construct(name, factory) {
    var component = factory();
    return this.register(name, component);
  }

  register(name, component) {
    component.application_context = this;
    this.components[name] = component;
    return component;
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
