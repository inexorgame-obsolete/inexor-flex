const expect = require('chai').expect;
const path = require('path');
const inexor_path = require('@inexor-game/path');
const tree = require('@inexor-game/tree');
const os = require('os');
const utils = require('../utils');

describe('Configurator utils', function() {
  describe('withinDirectory', function() {
    it('should check wether tmp is under the root directory', function() {
      expect(utils.withinDirectory(os.tmpdir(), '/')).to.be.true;
    })

    it('should check wether the test directory is a subdirectory of the configurator directory', function() {
      let _path = path.resolve(path.join(__dirname, '..'))
      expect(utils.withinDirectory(__dirname, _path)).to.be.true;
    })

    it('should be false for the tmp directory within the user folder', function() {
      expect(utils.withinDirectory(os.tmpdir(), os.homedir())).to.be.false;
    })
  })

  describe('readConfigFile', function() {
    it('should have a title and owner.name property in the example document', function() {
      let _path = path.resolve(path.join(__dirname) + '/example.toml')
      utils.readConfigFile(_path).then((example) => {
        expect(example).to.have.any.keys('title', 'owner.name')
      })
    })
  })

  describe('isInMediaOrConfigDirectory', function() {
    it('should be true for a folder thats under the config folder', function() {
      // Normally we expect config/instances.toml to be present
      expect(utils.isInMediaOrConfigDirectory(inexor_path.flex_path + '/config/instances.toml')).to.be.true;
    })

    it('should be true for a folder thats under the media folder', function() {
      expect(utils.isInMediaOrConfigDirectory(inexor_path.flex_path + '/media/data/interface/icon.png')).to.be.true;
    })

    it('should be false for the tmp folder', function() {
      expect(utils.isInMediaOrConfigDirectory(os.tmpdir())).to.be.false;
    })
  })
})
