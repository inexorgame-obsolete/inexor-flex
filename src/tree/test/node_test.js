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
    it('should no longer return a node with value xy, when added as a flex', function() {
      function getFlexChild() {
        let n = new Node('/', '', 'node');
        let obj = { x: 1 };
        let child = n.addChild('test', 'flex', obj)
        child.get()
      }
      expect(getFlexChild).to.throw('Not a valid data type: flex');
    })

    it('should be able to use keys passed by reference', function () {
      let n = new Node('/', '', 'node');

      ['a', 'b', 'c'].forEach((key) => {
        n.addChild(key, 'int64', 1)
      })

      expect(n.getChildNames().length).to.equal(3);
    })
  })

  describe('getChildNames', function() {
    it('should return an array with the node names', function() {
      let node = new Node(null, '', 'node');
      node.addChild('a', 'node');
      node.addChild('b', 'node');
      expect(node.getChildNames()).to.deep.equal(['a', 'b']);
    });

    it('should consistently return the same children names', function() {
      let node = new Node(null, '/', 'node');
      node.addChild('a', 'node');
      node.addChild('b', 'node');
      expect(node.getChildNames()).to.deep.equal(node.getChildNames());
    });

    it('should return an empty array for a fresh node', function() {
      let node = new Node(null, '/', 'node');
      expect(node.getChildNames()).to.deep.equal([]);
    })
  })

  describe('hasChildren', function() {
    it('should return false for an empty node', function() {
      let node = new Node(null, '/', 'node');
      expect(node.hasChildren()).to.be.false;
    })

    it('should return true for a node with children', function() {
      let node = new Node(null, '/', 'node');
      node.addChild('a', 'node');
      expect(node.hasChildren()).to.be.true;
    })

    it('should be possible to find node with dynamic key', function() {
      let node = new Node(null, '/', 'node');

      node.addChild('a', 'int64', 1);
      let keys = ['a']

      expect(keys.every((key) => node.hasChild(key))).to.be.true;
      expect(node.getChildNames().length).to.equal(1);
    })
  })

  describe('firstChild', function() {
    it('should return the first child added when 2 childs are added to a node', function() {
      let node = new Node(null, '/', 'node');
      node.addChild('a', 'node');
      node.addChild('b', 'node');
      expect(node.firstChild()).to.equal(node.getChild('a'));
    })
  })

  describe('toStr', function() {
    it('should serialize a string object', function() {
      let n = new Node(null, 'setting', 'string', 'someimportantsetting')
      expect(n.toString()).to.be.equal('someimportantsetting')
    })
  })
})
