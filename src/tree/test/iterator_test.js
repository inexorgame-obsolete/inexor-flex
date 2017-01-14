const chai = require('chai');
const chaiIterator = require('chai-iterator');
chai.use(chaiIterator);
const expect = chai.expect;

const Node = require('../Node');

describe('Iterator', function() {
  it('should iterate over a given tree', function() {
    let node = new Node(null, '/', 'node');
    node.addChild('test', 'string', 'testValue');
    node.addChild('toast', 'string', 'toastBread');
    node.addChild('num', 'int64', 1234);

    expect(node).to.be.iterable;
    expect(node).should.iterate.over('testValue', 'toastBread', 1234);
  })
})
