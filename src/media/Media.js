
/**
 * The media types.
 */
const media_types = [
  'map',
  'texture',
  'model',
  'sound'
];

class MediaManager {

  constructor(application_context) {
    var root = application_context.get('tree');
    var media_repository_manager = application_context.get('media_repository_manager');
    var media_node = root.getOrCreateNode('media');
    this.media_type_nodes = {};
    for (var i = 0; i < media_types.length; i++) {
      this.media_type_nodes[media_types[i]] = media_node.getOrCreateNode(media_types[i] + 's');
    }
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
   *   repository: 'https://github.com/inexor-game/data',
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
   *       repository: 'https://github.com/inexor-game/data',
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
  addMedia(type, name, repository, media_path, dependencies, author = '', license = '') {
    var media_type_node = this.media_type_nodes[type];
    var media_node = media_type_node.addNode(name);
    media_node.addChild('repository', 'string', repository);
    media_node.addChild('path', 'string', media_path);
    var dependency_node = media_node.addChild('dependencies', 'string', media_path);
    for (var i = 0; i < dependencies.length; i++) {
      dependency_node.addChild('path', 'string', media_path);
    }
  }

  removeMedia(type, name) {
    
  }

  addMap(name, repository, media_path, dependencies) {
    this.addMedia('map', name, repository, media_path, dependencies);
  }

  addTexture(name, repository, media_path, dependencies) {
    this.addMedia('texture', name, repository, media_path, dependencies);
  }

  addModel(name, repository, media_path, dependencies) {
    this.addMedia('model', name, repository, media_path, dependencies);
  }

  addSound(name, repository, media_path, dependencies) {
    this.addMedia('sound', name, repository, media_path, dependencies);
  }

}

module.exports = {
  MediaManager: MediaManager,
  media_types: media_types
}
