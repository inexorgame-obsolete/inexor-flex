const expect = require('chai').expect;
const types = require('../index');
const tree = require('@inexorgame/tree');

describe('objectToTree', function() {
  it('should contain a node with an item title', function() {
    let obj = { title: 'test' }
    let node = types.objectToTree(obj);
    expect(node.getChild('title').get()).to.equal('test');
  })
})
