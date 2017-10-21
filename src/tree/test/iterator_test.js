const chai = require('chai');
const chaiIterator = require('chai-iterator');
chai.use(chaiIterator);
const expect = chai.expect;

const Node = require('../Node');

describe('Iterator', function() {
  describe('Node', function() {
    it('should contain a valid iterator', function() {
      let node = new Node(null, '/', 'node');
      expect(node).to.be.iterable;
    })
    it('should return zero elements for a fresh node', function() {
      let node = new Node(null, '/', 'node');
      expect(node).to.iterate.for.lengthOf(0);
    })
    it('should return 2 for a node with 2 elements', function() {
      let node = new Node(null, '/', 'node');
      node.addChild('a', 'node');
      node.addChild('b', 'node');
      expect(node).to.iterate.for.lengthOf(2);
    })
    // This seems to be broken, please have a look at https://github.com/chaijs/chai/issues/908
    it('should iterate over child elements', function() {
      let node = new Node(null, '/', 'node');
      node.addChild('a', 'node');
      let node_a = node.getChild('a');
      node.addChild('b', 'node');
      let node_b = node.getChild('b');

      expect(node).to.iterate.over([node_a, node_b]);
    })
  })
})
