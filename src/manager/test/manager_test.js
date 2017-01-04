const expect = require('chai').expect;
const tree = require('@inexor-game/tree');
const manager = require('../');

describe('Manager', function() {
  describe('create', function() {
    it('should create an instance', function() {
      expect(manager.create('gabbagecli')).to.be.fulfilled;
    })

    it('should contain a valid tree instance after creation', function() {
      manager.create('gabbagecli').then((instance) => {
        expect(instance.tree).to.be.an.instanceof(tree.Root);
      })
    })
  })
})
