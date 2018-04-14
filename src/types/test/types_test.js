const expect = require('chai').expect;
const types = require('../index');

describe('objectToTree', function() {
  it('should contain a node with an item title', function() {
    let obj = { title: 'test' }
    let node = types.objectToTree(obj);
    expect(node.getChild('title')._get()).to.equal('test');
  })
})
