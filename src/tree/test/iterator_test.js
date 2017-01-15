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
    it('should return a single element for a fresh node', function() {
      let node = new Node(null, '/', 'node');
      expect(node).to.iterate.for.lengthOf(1);
    })
    it.only('should always return the root element as last element', function() {
      let node = new Node(null, '/', 'node');
      expect(node).to.iterate.until(node);
    })
  })
})
