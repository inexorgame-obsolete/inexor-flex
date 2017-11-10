const expect = require('chai').expect
const Root = require('../Root');
var r = new Root();

describe('Tree', function() {
  describe('findNode', function() {
    it('should find a node by its path', function() {
      let n = r.addChild('test', 'node');
      expect(n).to.be.equal(r.findNode('/test'))
    })

    it('should be possible to chain findNode', function() {
      r.addChild('test2', 'node');
      let n = r.findNode('/test2').addChild('some', 'node');
      expect(n).to.be.equal(r.findNode('/test2/some'))
    })
  })

  describe('contains', function() {
    it('should return true for a freshly inserted node', function() {
      r.addChild('newnode', 'node');
      expect(r.contains('/newnode')).to.be.true;
    })
  })
})
