const expect = require('chai').expect;
const util = require('../util');

describe('util', function() {
  describe('isValidDataType', function() {
    it('flex should not longer be valid', function() {
      expect(util.isValidDataType('flex')).to.be.false;
    })

    it('node should be valid', function() {
      expect(util.isValidDataType('node')).to.be.true;
    })

    it('int64 should be valid', function() {
      expect(util.isValidDataType('int64')).to.be.true;
    })

    it('string should be valid', function() {
      expect(util.isValidDataType('string')).to.be.true;
    })

    it('float should be valid', function() {
      expect(util.isValidDataType('float')).to.be.true;
    })

    it('bool should be valid', function() {
      expect(util.isValidDataType('bool')).to.be.true;
    })

    it('timestamp should be valid', function() {
      expect(util.isValidDataType('timestamp')).to.be.true;
    })
  })
})
