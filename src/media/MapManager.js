/**
 * @module media
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const toml = require('toml');
const util = require('util');

/**
 * Manages maps.
 */
class MapManager extends EventEmitter {

  /**
   * @constructor
   * @param {ApplicationContext} applicationContext - The application context.
   */
  constructor(applicationContext) {
    super();

    /// The media type to handle
    this.mediaType = 'map';

    /// Configuration for mapping the file structure into the Inexor Tree
    this.pathMappings = [
      {
        filename: 'octree.ogz',
        node: 'octree'
      }, {
        filename: 'waypoints.wpt',
        node: 'waypoints'
      }, {
        filename: 'readme.txt',
        node: 'readme'
      }, {
        filename: 'readme.md',
        node: 'readme'
      }
    ];
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

    /// The server list node
    this.mapsNode = this.mediaNode.getOrCreateNode('maps');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.MapManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   * @function
   */
  afterPropertiesSet() {
    this.updateMaps();
  }

  /**
   * Reads in the maps from filesystem into the Inexor Tree.
   * Tree path: /[repository_name]/[media_type]/[author_name/author_group_name]/[media_name]/v[version]/
   * @function
   */
  updateMaps() {
    let repositoryPaths = this.mediaRepositoryManager.getRepositoryPaths();
    for (var i = 0; i < repositoryPaths.length; i++) {
      let repositoryPath = repositoryPaths[i];
      let mapsPath = path.join(repositoryPath, this.mediaType);
      if (fs.existsSync(mapsPath)) {
        this.log.trace(util.format('Scanning repository maps path %s for authors', mapsPath));
        let authors = this.getSubDirs(mapsPath);
        for (var j = 0; j < authors.length; j++) {
          let author = authors[j];
          let authorNode = this.mapsNode.getOrCreateNode(author);
          let authorPath = path.join(mapsPath, author);
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
              this.log.trace(util.format('Scanning version path %s for map files', versionPath));
              this.findMapFiles(versionNode, versionPath);
              this.loadMapConfiguration(versionNode, versionPath);
            }
          }
        }
      } else {
        this.log.debug(util.format('Media repository %s does not contain a %s folder', repositoryPath, this.mediaType));
      }
    }
  }

  /**
   * Finds the map files by type (octree, config, specularity).
   * 
   * The filename must be {textureType}.{fileExtension}.
   * For example: diffuse.jpg
   * 
   * @function
   * @param {Tree.Node} versionNode - The tree node of a texture representing a texture with multiple texture files.
   * @param {string} versionPath - The path to the directory which contains the texture files.
   */
  findMapFiles(versionNode, versionPath) {
    for (var i = 0; i < this.pathMappings.length; i++) {
      let pathMapping = this.pathMappings[i];
      let filePath = path.join(versionPath, pathMapping.filename);
      if (fs.existsSync(filePath)) {
        let node;
        if (versionNode.hasChild(pathMapping.node)) {
          node = versionNode.getChild(pathMapping.node);
          node.set(filePath); 
        } else {
          node = versionNode.addChild(pathMapping.node, 'string', filePath);
        }
        this.log.trace(util.format('%s = %s', node.getPath(), node._get()));
      } else {
        this.log.trace(util.format('%s not found', filePath));
      }
    }
  }

  /**
   * Loads the map configuration file.
   */
  loadMapConfiguration(versionNode, versionPath) {
    let configPath = path.join(versionPath, 'config.toml');
    let configNode = versionNode.getOrCreateNode('config');
    if (fs.existsSync(configPath)) {
      this.log.debug(util.format('Loading map configuration from %s', configPath));
      let data = fs.readFileSync(configPath);
      try {
        let config = toml.parse(data.toString());
        this.createConfigTree(config, configNode);
      } catch (err) {
        this.log.error(err, util.format('Error in map configuration file: %s', configPath));
      }
    } else {
      this.log.warn(util.format('Could not find map configuration (expected file location: %s)', configPath));
    }
  }

  /**
   * 
   */
  createConfigTree(obj, node) {
    for (let property in obj) {
      if (obj.hasOwnProperty(property)) {
        try {
          if (typeof obj[property] == 'object') {
            if (node.hasChild(property)) {
              this.createConfigTree(obj[property], node.getChild(property));
            } else {
              this.createConfigTree(obj[property], node.addNode(property));
            }
          } else {
            if (node.hasChild(property)) {
              let pnode = node.getChild(property);
              pnode.set(this.convert(pnode._datatype, obj[property]));
              this.log.trace(util.format('%s = %s', pnode.getPath(), pnode._get()));
            } else {
              let datatype = this.getNodeDatatype(obj[property]);
              if (datatype != null) {
                let pnode = node.addChild(property, datatype, obj[property]);
                this.log.trace(util.format('%s = %s', pnode.getPath(), pnode._get()));
              } else {
                this.log.error(util.format('Unknown datatype for %s.%s', node.getPath(), property));
              }
            }
          }
        } catch (err) {
          this.log.error(err);
        }
      }
    }
  }
  
  getNodeDatatype(value) {
    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return (value % 1 === 0) ? 'int64' : 'float';
      case 'boolean':
        return 'bool';
      default:
        return null;
    }
  }

  /**
   * Converts an incoming string value to the target datatype.
   * TODO: move to tree utils
   * TODO: remove duplication
   */
  convert(datatype, value) {
    if (typeof value == 'string') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
          return parseInt(value);
        case 'float':
          return parseFloat(value);
        case 'bool':
          return (value == 'true');
        case 'string':
          return value;
        default:
          // timestamp, object, node,
          return null;
      }
    } else if (typeof value == 'number') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
        case 'float':
          return value;
        case 'bool':
          return value == 1 ? true : false;
        case 'string':
          return value.toString();
        default:
          // timestamp, object, node,
          return null;
      }
    } else if (typeof value == 'boolean') {
      switch (datatype) {
        case 'int32':
        case 'int64':
        case 'enum':
        case 'float':
          return value ? 1 : 0;
        case 'bool':
          return value;
        case 'string':
          return value.toString();
        default:
          // timestamp, object, node,
          return null;
      }
    } else {
      return null;
    }
  }

  getSubDirs(parentDir) {
    return fs.readdirSync(parentDir).filter(file => fs.lstatSync(path.join(parentDir, file)).isDirectory());
  }

  /**
   * Returns the names of the maps.
   * @function
   */
  getMapNames() {
    return this.mapsNode.getChildNames();
  }

}

module.exports = MapManager;
