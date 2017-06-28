/**
 * @module media
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const util = require('util');
const tree = require('@inexor-game/tree');

const inexor_path = require('@inexor-game/path');


/**
 * Manages textures.
 */
class TextureManager extends EventEmitter {

  /**
   * @constructor
   * @param {ApplicationContext} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();

    /// The media type to handle
    this.mediaType = 'texture';

    /**
     * 
     * "c" or 0 for primary diffuse texture (RGB)
     * "u" or 1 for generic secondary texture
     * "d" for decals (RGBA), blended into the diffuse texture if running in fixed-function mode.
     *     To disable this combining, specify secondary textures as generic with 1 or "u"
     * "n" for normal maps (XYZ)
     * "g" for glow maps (RGB), blended into the diffuse texture if running in fixed-function mode.
     *     To disable this combining, specify secondary textures as generic with 1 or "u"
     * "s" for specularity maps (grey-scale), put in alpha channel of diffuse ("c")
     * "z" for depth maps (Z), put in alpha channel of normal ("n") maps
     * "e" for environment maps (skybox), uses the same syntax as "loadsky",
     *     and set a custom environment map (overriding the "envmap" entities) to use in environment-mapped shaders ("bumpenv*world")
     */
    this.textureTypes = [ 'diffuse', 'secondardy', 'normals', 'specularity', 'depth' ];

    /// The file extensions of textures
    this.fileExtensions = [ 'png', 'jpg' ];

  }

  /**
   * Sets the dependencies from the application context.
   * @function
   */
  setDependencies() {

    /// The tree root
    this.root = this.applicationContext.get('tree');

    /// The file system repository manager
    this.mediaRepositoryManager = this.applicationContext.get('mediaRepositoryManager');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// The Inexor Tree node containing textures
    this.texturesNode = this.mediaNode.getOrCreateNode('textures');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.TextureManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {
    this.updateTextures();
  }

  /**
   * Reads in the textures from filesystem into the Inexor Tree.
   * Tree path: /[repository_name]/[media_type]/[author_name/author_group_name]/[media_name]/v[version]/
   * @function
   */
  updateTextures() {
    let repositoryPaths = this.mediaRepositoryManager.getRepositoryPaths();
    for (var i = 0; i < repositoryPaths.length; i++) {
      let repositoryPath = repositoryPaths[i];
      let texturePath = path.join(repositoryPath, this.mediaType);
      if (fs.existsSync(texturePath)) {
        this.log.trace(util.format('Scanning repository textures path %s for authors', texturePath));
        let authors = this.getSubDirs(texturePath);
        for (var j = 0; j < authors.length; j++) {
          let author = authors[j];
          let authorNode = this.texturesNode.getOrCreateNode(author);
          let authorPath = path.join(texturePath, author);
          let authorMedias = this.getSubDirs(authorPath);
          this.log.trace(util.format('Scanning author path %s for media names', authorPath));
          for (var k = 0; k < authorMedias.length; k++) {
            let mediaName = authorMedias[k];
            let mediaNode = authorNode.getOrCreateNode(mediaName);
            let mediaPath = path.join(authorPath, mediaName);
            let mediaVersions = this.getSubDirs(mediaPath);
            this.log.trace(util.format('Scanning media name path %s for versions', mediaPath));
            for (var l = 0; l < mediaVersions.length; l++) {
              let version = mediaVersions[l];
              let versionNode = mediaNode.getOrCreateNode(version);
              let versionPath = path.join(mediaPath, version);
              this.log.trace(util.format('Scanning version path %s for texture files', versionPath));
              this.findTextureFilesByTypes(versionNode, versionPath);
            }
          }
        }
      } else {
        this.log.debug(util.format('Media repository %s does not contain a %s folder', repositoryPath, this.mediaType));
      }
    }
  }

  /**
   * Finds the texture files by type (diffuse, normals, specularity).
   * 
   * The filename must be {textureType}.{fileExtension}.
   * For example: diffuse.jpg
   * 
   * @function
   * @param {Tree.Node} versionNode - The tree node of a texture representing a texture with multiple texture files.
   * @param {string} versionPath - The path to the directory which contains the texture files.
   */
  findTextureFilesByTypes(versionNode, versionPath) {
    for (var i = 0; i < this.textureTypes.length; i++) {
      let textureType = this.textureTypes[i];
      for (var j = 0; j < this.fileExtensions.length; j++) {
        let textureFileExtension = this.fileExtensions[j];
        let textureFilePath = path.join(versionPath, util.format('%s.%s', textureType, textureFileExtension));
        if (fs.existsSync(textureFilePath)) {
          var textureFileNode;
          if (versionNode.hasChild(textureType)) {
            textureFileNode = versionNode.getChild(textureType);
            textureFileNode.set(textureFilePath); 
          } else {
            textureFileNode = versionNode.addChild(textureType, 'string', textureFilePath);
          }
          this.log.debug(util.format('%s = %s', textureFileNode.getPath(), textureFileNode.get()));
          break;
        }
      }
    }
  }

  getSubDirs(parentDir) {
    return fs.readdirSync(parentDir).filter(file => fs.lstatSync(path.join(parentDir, file)).isDirectory());
  }

}

module.exports = TextureManager;
