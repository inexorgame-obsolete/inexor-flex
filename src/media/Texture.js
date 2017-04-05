const fs = require('fs');
const path = require('path');
const git = require("nodegit");
const util = require('util');
const tree = require('@inexor-game/tree');

const inexor_log = require('@inexor-game/logger');

const log = inexor_log('@inexor-game/flex/media/texture')


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
