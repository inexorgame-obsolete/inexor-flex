
const EventEmitter = require('events');

/**
 * The media types.
 */
const media_types = [
  'map',
  'texture',
  'model',
  'sound'
];

class MediaManager extends EventEmitter {

  /**
   * @constructor
   */
  constructor(applicationContext) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The media repository manager
    this.mediaRepositoryManager = this.applicationContext.get('mediaRepositoryManager');

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// Creating tree nodes for each media type
    this.mediaTypeNodes = {};
    for (let i = 0; i < media_types.length; i++) {
      this.mediaTypeNodes[media_types[i]] = this.mediaNode.getOrCreateNode(media_types[i] + 's');
    }

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    // The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.MediaManager');

  }

  /**
   *
   * media_path: the path to the folder containing the texture
   *
   * Unify filesystem representation of a texture:
   * - Enables loading textures into Inexor Tree
   * - Allows to make textures available via webserver
   *   - Use the texture in the UI (Texture Browser)
   *   - Download textures from a remote server (the structure is the same)
   *
   * ## Path to the media folder
   * /:repository_name/:media_type+'s'/:media_name
   *
   * ## Path to the config file (contains: author, license, dependencies)
   * /:repository_name/:media_type+'s'/:media_name/config.json
   * {
   *   name: ':media_name',
   *   description: 'Long text',
   *   tags: [ 'tag1', 'tag2', 'tag3' ],
   *   repository: 'https://github.com/inexorgame/data',
   *   author: '',
   *   license: '',
   *   // The properties of a media type depends on media type
   *   properties: {
   *     // Textures:
   *     shader: 'bumpparallaxworld'
   *   },
   *   // The dependencies refer to another resource
   *   dependencies: [
   *     {
   *       repository: 'https://github.com/inexorgame/data',
   *       name: ':media_name',
   *       type: ':media_type'
   *     }
   *   ]
   * }
   *
   * ## Path to the readme
   * /:repository_name/:media_type+'s'/:media_name/readme.[txt|md|html]
   *
   * ## The texture itself
   * /:repository_name/textures/:texture_name/texture.[png|jpg]
   *
   * ## The normal map
   * repo/textures/:texture_name/normalmap.[png|jpg]
   *
   * ## The height map
   * /:repository_name/textures/:texture_name/heightmap.[png|jpg]
   *
   * "c" or 0 for primary diffuse texture (RGB)
   * "u" or 1 for generic secondary texture
   * "d" for decals (RGBA), blended into the diffuse texture if running in fixed-function mode. To disable this combining, specify secondary textures as generic with 1 or "u"
   * "n" for normal maps (XYZ)
   * "g" for glow maps (RGB), blended into the diffuse texture if running in fixed-function mode. To disable this combining, specify secondary textures as generic with 1 or "u"
   * "s" for specularity maps (grey-scale), put in alpha channel of diffuse ("c")
   * "z" for depth maps (Z), put in alpha channel of normal ("n") maps
   * "e" for environment maps (skybox), uses the same syntax as "loadsky", and set a custom environment map (overriding the "envmap" entities) to use in environment-mapped shaders ("bumpenv*world")
   *
   */
  addMedia(type, name, repository, mediaPath, dependencies, author = '', license = '') {
    let mediaTypeNode = this.mediaTypeNodes[type];
    let mediaNode = mediaTypeNode.addNode(name);
    mediaNode.addChild('repository', 'string', repository);
    mediaNode.addChild('path', 'string', mediaPath);
    var dependencyNode = mediaNode.addChild('dependencies', 'string', mediaPath);
    for (var i = 0; i < dependencies.length; i++) {
      dependencyNode.addChild('path', 'string', mediaPath);
    }
  }

  removeMedia(type, name) {

  }

  addMap(name, repository, mediaPath, dependencies) {
    this.addMedia('map', name, repository, mediaPath, dependencies);
  }

  addTexture(name, repository, mediaPath, dependencies) {
    this.addMedia('texture', name, repository, mediaPath, dependencies);
  }

  addModel(name, repository, mediaPath, dependencies) {
    this.addMedia('model', name, repository, mediaPath, dependencies);
  }

  addSound(name, repository, mediaPath, dependencies) {
    this.addMedia('sound', name, repository, mediaPath, dependencies);
  }

}

module.exports = {
  MediaManager: MediaManager,
  media_types: media_types
}
