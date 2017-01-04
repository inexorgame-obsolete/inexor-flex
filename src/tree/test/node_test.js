const expect = require('chai').expect
const Node = require('../Node');

describe('Node', function() {
  describe('constructor', function() {
    it('should not initialize with missing parameters', function() {
      function createNode() {
        return new Node(null); // This is invalid
      }
      expect(createNode).to.throw('Invalid data type');
    })

    it('should not allow prefixed child insertions', function() {
      function createNode() {
        let r = new Node('/', '', 'node');
        return r.addChild('/test', 'node');
      }
      expect(createNode).to.throw('Child nodes shall not be prefixed with /');
    })
  })

  describe('addChild', function() {
    it('should return a node with value xy, when added as a flex', function() {
      let n = new Node('/', '', 'node');
      let obj = { x: 1 };
      let child = n.addChild('test', 'flex', obj)
      expect(child.get()).to.be.equal(obj);
    })
  })

  describe('toStr', function() {
    it('should serialize a string object', function() {
      let n = new Node(null, 'setting', 'string', 'someimportantsetting')
      expect(n.toString()).to.be.equal(JSON.stringify('someimportantsetting'))
    })
  })
})
