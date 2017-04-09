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

    // Returns the subtree of tree node of an instance tree.
    this.router.get('/instances/:id/dump', this.dumpInstanceTree.bind(this));

    // Returns the value of the tree node.
    this.router.get('/instances/:id/*', this.getNode.bind(this));

    // Sets the value of the tree node.
    this.router.post('/instances/:id/*', this.setNode.bind(this));

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
  getNode(req, res) {
    if (this.instancesNode.hasChild(req.params.id)) {
      let path = req.param(0);
      let full_path = '/instances/' + req.params.id + '/' + path;
      let node = this.root.findNode(full_path);
      if (node != null) {
        // TODO: handle container nodes
        res.status(200).json(node.get());
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
  setNode(req, res) {
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

}

module.exports = InexorTreeRestAPI;
