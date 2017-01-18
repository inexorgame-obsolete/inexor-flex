const fs = require('fs');
const path = require('path');
const git = require("nodegit");
const util = require('util');
const tree = require('@inexor-game/tree');
const log = require('@inexor-game/logger')();


/**
 * Manages textures.
 */
class TextureManager {

  constructor(application_context) {
  }

  /**
   * Scans the given repository for textures.
   */
  scan(repository) {
    
  }

}

module.exports = {
  TextureManager: TextureManager
}
