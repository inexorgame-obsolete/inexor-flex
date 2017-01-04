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

  describe('toStr', function() {
    it('should serialize a string object', function() {
      let n = new Node(null, 'setting', 'string', 'someimportantsetting')
      expect(n.toString()).to.be.equal(JSON.stringify('someimportantsetting'))
    })
  })
})
