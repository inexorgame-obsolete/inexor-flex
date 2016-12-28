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
  })
})
