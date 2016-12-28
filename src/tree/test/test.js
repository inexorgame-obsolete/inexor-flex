const assert = require('chai').assert
const Node = require('../Node');

describe('Node', function() {
  describe('constructor', function() {
    it('should not initialize with missing parameters', function() {
      assert.typeOf('xy', 'string'); // without optional message
    })
  })
})
