/**
 * REST API for managing tree nodes of the Inexor Tree.
 */
class InexorTreeRestAPI {

  /**
   * Constructs the Inexor Tree REST API.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The Inexor Tree
    this.root = applicationContext.get('tree');

    // The tree node which contains all instance nodes
    this.instancesNode = this.root.getOrCreateNode('instances');

    // Returns the root tree.
    this.router.get('/tree/dump', this.dumpRootTree.bind(this));

    // Returns the value of the tree node.
    this.router.get('/tree/*', this.getRootNode.bind(this));

    // Sets the value of the tree node.
    this.router.post('/tree/*', this.setRootNode.bind(this));

    // Returns the subtree of tree node of an instance tree.
    this.router.get('/instances/:id/dump', this.dumpInstanceTree.bind(this));

    // Returns the value of the tree node.
    this.router.get('/instances/:id/*', this.getInstanceNode.bind(this));

    // Sets the value of the tree node.
    this.router.post('/instances/:id/*', this.setInstanceNode.bind(this));

  }

  /**
   * Dumps the subtree of the instance.
   */
  dumpRootTree(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(this.root.toObject());
  }

  /**
   * Returns the value of the tree node.
   */
  getRootNode(req, res) {
    let path = req.param(0);
    let node = this.root.findNode('/' + path);
    if (node != null) {
      // TODO: handle container nodes
      if (node.isContainer) {
        res.status(200).json(node.getChildNames());
      } else {
        res.status(200).json(node.get());
      }
    } else {
      res.status(404).send('Key with path ' + path + ' was not found');
    }
  }

  /**
   * Sets the value of the tree node.
   */
  setRootNode(req, res) {
    let path = req.param(0);
    let node = this.root.findNode('/' + path);
    if (node != null) {
      // TODO: handle container nodes
      let value = this.convert(node._datatype, req.body.value);
      if (value != null) {
        node.set(value, req.body.nosync);
        res.status(200).json(node.get());
      } else {
        res.status(404).send('Invalid data type');
      }
      // node.set(req.body.value, req.body.nosync);
      // res.status(200).json(node.get());
    } else {
      res.status(404).send('Key with path ' + path + ' was not found');
    }
  }

  /**
   * Dumps the subtree of the instance.
   */
  dumpInstanceTree(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let instanceNode = this.instancesNode.getChild(req.params.id);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(instanceNode.toObject());
    } else {
      res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Returns the value of the tree node.
   */
  getInstanceNode(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let path = req.param(0);
      let full_path = '/instances/' + req.params.id + '/' + path;
      let node = this.root.findNode(full_path);
      if (node != null) {
        if (node.isContainer) {
          res.status(200).json(node.getChildNames());
        } else {
          res.status(200).json(node.get());
        }
      } else {
        res.status(404).send('Key with path ' + path + ' was not found');
      }
    } else {
      res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Sets the value of the tree node.
   */
  setInstanceNode(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let path = req.param(0);
      let full_path = '/instances/' + req.params.id + '/' + path;
      let node = this.root.findNode(full_path);
      if (node != null) {
        // TODO: handle container nodes
        node.set(req.body.value, req.body.nosync);
        res.status(200).json(node.get());
      } else {
        res.status(404).send('Key with path ' + path + ' was not found');
      }
    } else {
      res.status(404).send(util.format('Instance with id %s was not found', req.params.id));
    }
  }

  /**
   * Converts an incoming string value to the target datatype.
   */
  convert(datatype, value) {
    if (typeof value == 'string') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
          return parseInt(value);
        case 'float':
          return parseFloat(value);
        case 'bool':
          return (value == 'true');
        case 'string':
          return value;
        default:
          // timestamp, object, node,
          return null;
      }
    }
  }

}

module.exports = InexorTreeRestAPI;
