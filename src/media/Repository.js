const fs = require('fs');
const path = require('path');
const git = require("nodegit");
const util = require('util');
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');
const log = require('@inexor-game/logger')();

/**
 * The media repository types.
 */
const repository_types = [
  'fs',
  'git',
  'db'
];

class FilesystemRepositoryManager {

  /**
   * Constructs the FilesystemRepositoryManager.
   * @constructor
   * @param {string} media_path - The path to a folder which contains the media repositories.
   */
  constructor(repositories_node, media_path = null) {
    this.repositories_node = repositories_node;
    this.media_path = media_path;
    if (this.media_path != null) {
      this.scan(this.media_path);
    }
  }

  /**
   * Scans the file system for media repositories starting at the base dir.
   * @function
   * @name FilesystemRepositoryManager.scan
   * @param {string} media_path - The starting point for scanning.
   * @return An array containing the created repository nodes.
   */
  scan(media_path = null) {
    try {
      var _media_path = media_path;
      if (_media_path == null) {
        _media_path = this.media_path;
      }
      log.info(util.format("Scaning media path %s for FS media repositories", _media_path));
      var nodes = [];
      var self = this;
      this.get_sub_directories(_media_path).forEach(function(repository_name) {
        var repository_dir = path.join(_media_path, repository_name);
        if (!self.exists(repository_name)) {
          try {
            let node = self.addRepository(repository_name, repository_dir);
            nodes.push(node);
            log.info(util.format('Added FS media repository %s: %s', repository_name, repository_dir));
          } catch (err) {
            log.warn(err.message);
          }
        } else {
          log.info(util.format('Skipping known media repository %s: %s', repository_name, repository_dir));
        }
      });
      return nodes;
    } catch (err) {
      log.error('Failed to scan media path: ' + media_path, err);
    }
  }

  exists(name) {
    return this.repositories_node.hasChild(name);
  }

  get_sub_directories(_path) {
    return fs.readdirSync(_path).filter(function(file) {
      return fs.statSync(path.join(_path, file)).isDirectory();
    });
  }

  /**
   * Adds an existing media repository to the Inexor Tree. The repository is located
   * at the local filesystem. The given path must exist!
   * @function
   * @name FilesystemRepositoryManager.addRepository
   * @param {string} name - The name of the media repository
   * @param {string} repository_path - The absolute path to the base folder of the media repository.
   * @return {Node} The repository node.
   */
  addRepository(name, repository_path) {
    if (name != null && repository_path != null) {
      if (!this.exists(name)) {
        if (fs.existsSync(repository_path)) {
          if (!fs.existsSync(path.join(repository_path, '.git'))) {
            let node = this.repositories_node.addNode(name);
            node.addChild('type', 'string', 'filesystem');
            node.addChild('path', 'string', repository_path);
            return node;
          } else {
            throw new Error('Can\'t add a repository of type GIT');
          }
        } else {
          throw new Error('Directory doesn\'t exist: ' + repository_path);
        }
      } else {
        throw new Error('A repository with name ' + name + ' already exists!');
      }
    } else {
      throw new Error('Name and path are mandatory!');
    }
  }

  /**
   * Creates a new media repository located at the local filesystem. The given path
   * must not exist and the folder will be created.
   * @function
   * @name FilesystemRepositoryManager.createRepository
   * @param {string} name - The name of the media repository
   * @param {string} repository_path - The absolute path to the base folder of the media repository.
   * @return {Node} The repository node.
   */
  createRepository(name, repository_path) {
    if (name != null && repository_path != null) {
      if (!this.exists(name)) {
        if (!fs.existsSync(repository_path)) {
          let node = this.repositories_node.addNode(name);
          node.addChild('type', 'string', 'filesystem');
          node.addChild('path', 'string', repository_path);
          fs.mkdirSync(repository_path);
          return node;
        } else {
          throw new Error('The given path already exists: ' + repository_path);
        }
      } else {
        throw new Error('A repository with name ' + name + ' already exists!');
      }
    } else {
      throw new Error('Name and path are mandatory!');
    }
  }

}

class GitRepositoryManager {

  /**
   * Constructs the GitRepositoryManager.
   * @constructor
   * @param {string} media_path - The path to a folder which contains the media repositories.
   */
  constructor(repositories_node, media_path = null) {
    this.repositories_node = repositories_node;
    this.media_path = media_path;
    if (this.media_path != null) {
      this.scan(this.media_path);
    }
  }

  /**
   * Scans the file system for media repositories starting at the base dir.
   * @function
   * @name GitRepositoryManager.scan
   * @param {string} media_path - The starting point for scanning.
   * @return An array containing the created repository nodes.
   */
  scan(media_path = null) {
    try {
      var _media_path = media_path;
      if (_media_path == null) {
        _media_path = this.media_path;
      }
      log.info(util.format("Scaning media path %s for GIT media repositories", _media_path));
      var nodes = [];
      var self = this;
      this.get_sub_directories(_media_path).forEach(function(repository_name) {
        var repository_dir = path.join(_media_path, repository_name);
        if (!self.exists(repository_name)) {
          try {
            let node = self.addRepository(repository_name, repository_dir);
            nodes.push(node);
            log.info(util.format('Added FS media repository %s: %s', repository_name, repository_dir));
          } catch (err) {
            log.warn(err.message);
          }
        } else {
          log.info(util.format('Skipping known media repository %s: %s', repository_name, repository_dir));
        }
      });
      return nodes;
    } catch (err) {
      log.error('Failed to scan media path: ' + media_path, err);
    }
  }

  exists(name) {
    return this.repositories_node.hasChild(name);
  }

  get_sub_directories(_path) {
    return fs.readdirSync(_path).filter(function(file) {
      return fs.statSync(path.join(_path, file)).isDirectory();
    });
  }

  /**
   * Adds an existing GIT repository to the Inexor Tree.
   * @function
   * @name GitRepositoryManager.addRepository
   * @param {string} name - The name of the media repository
   * @param {string} repository_path - The absolute path to the base folder of the media repository.
   * @param {string} url - The url of the remote GIT repository.
   * @return {Node} The repository node.
   */
  addRepository(name, repository_path, url) {
    if (name != null && repository_path != null) {
      if (!this.exists(name)) {
        if (fs.existsSync(repository_path)) {
          if (fs.existsSync(path.join(repository_path, '.git'))) {
            let node = this.repositories_node.addNode(name);
            node.addChild('type', 'string', 'git');
            node.addChild('path', 'string', repository_path);
            if (url != null)  {
              node.addChild('url', 'string', url);
            }
            // Update the repository
            this.updateRepository(name);
            return node;
          } else {
            throw new Error('The repository is not of type GIT');
          }
        } else {
          throw new Error('Directory doesn\'t exist: ' + repository_path);
        }
      } else {
        throw new Error('A repository with name ' + name + ' already exists!');
      }
    } else {
      throw new Error('Name and path are mandatory!');
    }
  }

  /**
   * Creates a new git repository. The local path must not exist. After creation the
   * @function
   * @name GitRepositoryManager.createRepository
   * @param {string} name - The name of the media repository
   * @param {string} repository_path - The absolute path to the base folder of the media repository.
   * @param {string} url - The url of the remote GIT repository.
   * @return {Node} The repository node.
   */
  createRepository(name, repository_path, url) {
    if (name != null && repository_path != null) {
      if (!this.exists(name)) {
        if (!fs.existsSync(repository_path)) {
          let node = this.repositories_node.addNode(name);
          // TODO: use the javascript getter/setter magic!
          // node.type = 'git';
          node.addChild('type', 'string', 'git');
          node.addChild('path', 'string', repository_path);
          node.addChild('url', 'string', url);
          node.addChild('branch', 'string', 'master');
          // Initially clone the repository
          this.updateRepository(name, true);
          return node;
        } else {
          throw new Error('Directory already exist: ' + repository_path);
        }
      } else {
        throw new Error('A repository with name ' + name + ' already exists!');
      }
    } else {
      throw new Error('Name and path are mandatory!');
    }
  }

  /**
   * Updates a git repository.
   * @function
   * @name GitRepositoryManager.updateRepository
   * @param {string} name - The repository name.
   */
  updateRepository(name, clone = false) {
    let repository_node = this.repositories_node.getChild(name);
    let repository_path = this.repositories_node.getChild(name).path;
    if (clone) {
      log.info(util.format('Cloning media repository %s from %s to local path %s', name, repository_node.url, repository_node.path));
      git.Clone(repository_node.url, repository_node.path, {}).then(function(repository) {
        log.info(util.format('Successfully cloned media repository %s from %s to local path %s', name, repository_node.url, repository_node.path));
        repository_node.branch = repository.getBranch();
      }).catch(function(err) {
        log.error(err);
      });
    } else {
      git.Repository.open(repository_path).then(function(repository) {
        repository_node.branch = repository.getBranch();
      });
    }
  }

}

/**
 * The MediaRepositoryManager manages the media repositories. The repositories
 * can be repositories in the local file system or public remote repositories.
 * 
 */
class MediaRepositoryManager {

  /**
   * Constructs the MediaRepositoryManager.
   * @constructor
   * @param {Node} root - The root node of the Inexor Tree.
   * @param {string} media_path - The path to a folder which contains the media repositories.
   */
  constructor(root, media_path = null) {
    this.initTree(root);
    this.initMediaPath(media_path);
    this.fs = new FilesystemRepositoryManager(this.repositories_node, this.media_path);
    this.git = new GitRepositoryManager(this.repositories_node, this.media_path);
    // Print scan result
    log.info(this.repositories_node.toString());
  }

  /**
   * Initializes the Inexor Tree structure for media repositories.
   * @function
   * @param {Node} root - The root node of the Inexor Tree.
   */
  initTree(root) {
    this.root = root;
    if (!this.root.hasChild('media')) {
      this.media_node = this.root.addNode('media');
    } else {
      this.media_node = this.root.getChild('media');
    }
    if (!this.media_node.hasChild('repositories')) {
      this.repositories_node = this.media_node.addNode('repositories');
    } else {
      this.repositories_node = this.media_node.getChild('repositories');
    }
  }

  /**
   * Initializes the media path member.
   * @function
   * @param {string} media_path - The path to a folder which contains the media repositories.
   */
  initMediaPath(media_path) {
    if (media_path != null) {
      this.media_path = media_path;
    } else {
      // TODO: check if absolute file or relative
      this.media_path = path.resolve(path.join(inexor_path.getBasePath(), inexor_path.media_path));
    }
  }

  /**
   * Returns the Inexor Tree node which contains all repository nodes.
   * @function
   * @name MediaRepositoryManager.getRepositoriesNode
   * @return {Node} - The Inexor Tree node which contains all repository nodes.
   */
  getRepositoriesNode() {
    return this.repositories_node;
  }

  /**
   * Returns true, if a repository with the given name exists in the Inexor Tree.
   * @function
   * @name MediaRepositoryManager.exists
   * @param {string} name - The name of the media repository
   * @return {bool} True, if a repository with the given name exists in the Inexor Tree.
   */
  exists(name) {
    return this.repositories_node.hasChild(name);
  }

  scan() {
    this.fs.scan(this.media_path);
    this.git.scan(this.media_path);
  }

  /**
   * Remove a repository from the Inexor Tree.
   * @function
   * @name MediaRepositoryManager.remove
   * @param {string} name - The name of the media repository
   */
  remove(name) {
    if (this.exists(name)) {
      this.repositories_node.removeChild(name);
    }
  }

}

module.exports = {
  MediaRepositoryManager: MediaRepositoryManager,
  FilesystemRepositoryManager: FilesystemRepositoryManager,
  GitRepositoryManager: GitRepositoryManager,
  repository_types: repository_types
}
