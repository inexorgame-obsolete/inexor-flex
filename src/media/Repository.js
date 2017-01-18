const fs = require('fs');
const path = require('path');
const git = require('nodegit');
const util = require('util');
const tree = require('@inexor-game/tree');
const inexor_path = require('@inexor-game/path');
const log = require('@inexor-game/logger')();
const mkdirp = require('mkdirp');

/**
 * The media repository types.
 * Future types may be 'http+rest', 'mongo'
 */
const repository_types = [
  'fs',
  'git'
];

class FilesystemRepositoryManager {

  /**
   * Constructs the FilesystemRepositoryManager.
   * @constructor
   * @param {string} media_path - The path to a folder which contains the media repositories.
   */
  constructor(repositories_node, media_path = null) {
    this.repositories_node = repositories_node;
    this.scanAll();
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
        _media_path = inexor_path.media_path;
      }
      log.info(util.format('Scaning media path %s for FS media repositories', _media_path));
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
      log.warn(util.format('Failed to scan media path %s: %s', _media_path, err.message));
    }
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name FilesystemRepositoryManager.scanAll
   */
  scanAll() {
    var media_paths = inexor_path.getMediaPaths();
    for (var i = 0; i < media_paths.length; i++) {
      this.scan(media_paths[i]);
    }
  }

  /**
   * Returns true if a media repository exists in the Inexor Tree.
   * @function
   * @name FilesystemRepositoryManager.exists
   * @return {boolean}
   */
  exists(name) {
    return this.repositories_node.hasChild(name);
  }

  /**
   * Returns a list of sub directories for the given path.
   * @function
   * @name FilesystemRepositoryManager.get_sub_directories
   */
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
   * @param {Node} repositories_node - The node which contains the repositories.
   */
  constructor(repositories_node) {
    this.repositories_node = repositories_node;
    this.scanAll();
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
        _media_path = inexor_path.media_path;
      }
      log.info(util.format('Scaning media path %s for GIT media repositories', _media_path));
      var nodes = [];
      var self = this;
      this.get_sub_directories(_media_path).forEach(function(repository_name) {
        var repository_dir = path.join(_media_path, repository_name);
        if (!self.exists(repository_name)) {
          try {
            let node = self.addRepository(repository_name, repository_dir);
            nodes.push(node);
            log.info(util.format('Added GIT media repository %s: %s', repository_name, repository_dir));
          } catch (err) {
            log.warn(err.message);
          }
        } else {
          log.info(util.format('Skipping known media repository %s: %s', repository_name, repository_dir));
        }
      });
      return nodes;
    } catch (err) {
      log.warn(util.format('Failed to scan media path %s: %s', _media_path, err.message));
    }
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name GitRepositoryManager.scanAll
   */
  scanAll() {
    var media_paths = inexor_path.getMediaPaths();
    for (var i = 0; i < media_paths.length; i++) {
      this.scan(media_paths[i]);
    }
  }

  /**
   * Returns true if a media repository exists in the Inexor Tree.
   * @function
   * @name GitRepositoryManager.exists
   * @return {boolean}
   */
  exists(name) {
    return this.repositories_node.hasChild(name);
  }

  /**
   * Returns a list of sub directories for the given path.
   * @function
   * @name GitRepositoryManager.get_sub_directories
   */
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
   * --------- @param {string} url - The url of the remote GIT repository. ---------
   * @return {Node} The repository node.
   */
  addRepository(name, repository_path /*, url */) {
    if (name != null && repository_path != null) {
      if (!this.exists(name)) {
        if (fs.existsSync(repository_path)) {
          if (this.isGitRepository(repository_path)) {
            let node = this.repositories_node.addNode(name);
            node.addChild('type', 'string', 'git');
            node.addChild('path', 'string', repository_path);
            node.addChild('url', 'string', '');
            node.addChild('branch', 'string', 'master');
            node.addNode('branches');
            // Update the repository
            this.update(name);
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
   * Returns true, if the media repository is a git repository.
   * @function
   * @name GitRepositoryManager.isGitRepository
   * @param {string} repository_path - The absolute path to the base folder of the media repository.
   * @return {boolean} The repository node.
   */
  isGitRepository(repository_path) {
    return fs.existsSync(path.join(repository_path, '.git'))
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
          node.addNode('branches');
          // Initially clone the repository
          this.update(name, null, true);
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
   * @name GitRepositoryManager.update
   * @param {string} name - The repository name.
   * @param {string} branch_name - If true, the repository will be cloned.
   * @param {boolean} clone - If true, the repository will be cloned.
   */
  update(name, branch_name = null, clone = false) {
    let repository_node = this.repositories_node.getChild(name);
    let repository_path = this.repositories_node.getChild(name).path;
    var self = this;
    if (clone) {
      // git clone
      log.info(util.format('Cloning media repository %s from %s to local path %s', name, repository_node.url, repository_node.path));
      var repository;
      git.Clone(repository_node.url, repository_node.path, {
        fetchOpts: {
          callbacks: {
            certificateCheck: function() {
              return 1;
            }
          }
        }
      }).then(function(repo) {
        repository = repo;
        log.info(util.format('Successfully cloned media repository %s', name));
        return self.getBranches(name, repository);
      }).then(function(repository) {
        return self.getCurrentBranch(name, repository);
      }).catch(function(err) {
        log.error(err);
      });
    } else {
      // git pull
      log.info(util.format('[%s] Updating media repository (url: %s local: %s)', name, repository_node.url, repository_node.path));
      var repository;
      git.Repository
        .open(repository_path)
        .then(function(repo) {
          repository = repo;
          log.debug(util.format('[%s] Opened media repository', name));
          return self.getBranches(name, repository);
        })
        .then(function(repository) {
          return self.getCurrentBranch(name, repository);
        })
        .then(function(repository) {
          return self.fetchAll(name, repository);
        })
        .then(function(repository) {
          return self.mergeBranches(name, repository);
        })
        .then(function(repository) {
          if (branch_name != null) {
            return self.checkoutBranch(name, repository, branch_name);
          } else {
            return repository;
          }
        })
        .done(function() {
          log.info(util.format('[%s] Successfully updated media repository', name));
        });
    }
  }

  /**
   * Fetches updates from the remote repository.
   * @function
   * @name GitRepositoryManager.mergeBranches
   * @param {string} name - The repository name.
   * @param {Repository} repository - The git repository.
   */
  fetchAll(name, repository) {
    log.debug(util.format('[%s] Fetching new data from remote', name));
    return repository
      .fetchAll({
        callbacks: {
          certificateCheck: function() {
            return 1;
          }
        }
      })
      .then(function() {
        log.debug(util.format('[%s] Successfully fetched data', name));
        return repository;
      });
  }

  /**
   * Merges the previously fetched updates from remote into the local copy.
   * @function
   * @name GitRepositoryManager.mergeBranches
   * @param {string} name - The repository name.
   * @param {Repository} repository - The git repository.
   */
  mergeBranches(name, repository) {
    let branch_node = this.repositories_node.getChild(name).branch;
    let branches_node = this.repositories_node.getChild(name).branches;
    let local_branch = branches_node.getChild(branch_node).local;
    let local = local_branch.substr(11);
    let remote_branch = branches_node.getChild(branch_node).remote;
    let remote = remote_branch.substr(13);
    log.debug(util.format('[%s] Merging new data from remote branch %s into local branch %s', name, remote, local));
    return repository
      .mergeBranches(local, remote)
      .then(function() {
        log.debug(util.format('[%s] Successfully merged new data', name));
        return repository;
      });
  }

  /**
   * Checkout the given branch.
   * @function
   * @name GitRepositoryManager.checkoutBranch
   * @param {string} name - The repository name.
   * @param {Repository} repository - The git repository.
   * @param {string} branch_name - If true, the repository will be cloned.
   */
  checkoutBranch(name, repository, branch_name) {
    let branch_node = this.repositories_node.getChild(name).branch;
    return repository
      .getBranch('refs/remotes/origin/' + branch_name)
      .then(function(reference) {
        let branch_name = reference.toString().substr(20);
        if (branch_name == '') {
          branch_name = 'master';
        }
        log.info(util.format('[%s] Checking out branch %s (%s)', name, branch_name, reference.toString()));
        branch_node = branch_name;
        return repository
          .checkoutBranch(branch_name)
          .then(function() {
            log.info(util.format('[%s] Successfully checked out branch %s (%s)', name, branch_name, reference.toString()));
            return repository;
          })
          .catch(function(err) {
            log.info(err);
            return repository
              .checkoutRef(reference)
              .then(function(commit) {
                log.info("creating local branch");
                return repository
                  .getHeadCommit()
                  .then(function(commit) {
                    return repository
                      .createBranch(branch_name, commit, true)
                      .then(function(reference) {
                        log.info(util.format('[%s] Successfully created local branch %s (%s)', name, branch_name, reference.toString()));
                        return repository
                          .checkoutBranch(branch_name)
                          .then(function() {
                            log.info(util.format('[%s] Successfully checked out branch %s (%s)', name, branch_name, reference.toString()));
                            return repository;
                          });
                      });
                  });
              });
          });
      });
  }

  /**
   * Sets the current branch name of the given repository in the Inexor Tree.
   * @function
   * @name GitRepositoryManager.getCurrentBranch
   * @param {string} name - The repository name.
   * @param {Repository} repository - The git repository.
   */
  getCurrentBranch(name, repository) {
    // TODO: update branch node
    let branch_node = this.repositories_node.getChild(name).branch;
    return repository
      .getCurrentBranch()
      .then(function(reference) {
        let branch_name = reference.toString().substr(11);
        if (branch_name == '') {
          branch_name = 'master';
        }
        log.debug(util.format('[%s] Current branch is %s', name, branch_name));
        branch_node = branch_name;
        return repository;
      });
  }

  /**
   * Sets the branch names of the given repository in the Inexor Tree.
   * @function
   * @name GitRepositoryManager.getBranches
   * @param {string} name - The repository name.
   * @param {Repository} repository - The git repository.
   */
  getBranches(name, repository) {
    let repository_node = this.repositories_node.getChild(name);
    let branches_node = this.repositories_node.getChild(name).branches;
    return repository
      .getReferenceNames(git.Reference.TYPE.LISTALL)
      .then(function(reference_names) {
        for (var i = 0; i < reference_names.length; i++) {
          var reference_name = reference_names[i];
          if (reference_name.substr(0, 11) == 'refs/heads/') {
            // local branch
            var branch_name = reference_name.substr(11);
            var branch_node;
            if (branches_node.hasChild(branch_name)) {
              branch_node = branches_node.getChild(branch_name);
            } else {
              branch_node = branches_node.addNode(branch_name);
            }
            if (branch_node.hasChild('local')) {
              branch_node.getChild('local').set(reference_name);
            } else {
              branch_node.addChild('local', 'string', reference_name);
            }
          } else if (reference_name.substr(0, 20) == 'refs/remotes/origin/') {
            // remote branch
            var branch_name = reference_name.substr(20);
            var branch_node;
            if (branches_node.hasChild(branch_name)) {
              branch_node = branches_node.getChild(branch_name);
            } else {
              branch_node = branches_node.addNode(branch_name);
            }
            if (branch_node.hasChild('remote')) {
              branch_node.getChild('remote').set(reference_name);
            } else {
              branch_node.addChild('remote', 'string', reference_name);
            }
          }
        }
        log.debug(branches_node.toString());
        return repository;
      });
  }

}

/**
 * The MediaRepositoryManager manages the media repositories. The repositories
 * can be repositories in the local file system or public remote repositories.
 */
class MediaRepositoryManager {

  /**
   * Constructs the MediaRepositoryManager.
   * @constructor
   * @param {ApplicationContext} application_context - The application context.
   */
  constructor(application_context) {
    
    // Create the basic structure in the Inexor Tree
    var root = application_context.get('tree');
    var media_node = root.getOrCreateNode('media');
    this.repositories_node = media_node.getOrCreateNode('repositories');

    // Ensure that the default media path exists
    mkdirp.sync(inexor_path.media_path);

    // Publish the media paths on the Inexor Tree
    var paths_node = media_node.getOrCreateNode('paths');
    var media_paths = inexor_path.getMediaPaths();
    for (var i = 0; i < media_paths.length; i++) {
      paths_node.addChild(String(i), 'string', media_paths[i]);
    }
    log.info(paths_node.toString());

    // Create the manager instances for the repository types
    this.fs = new FilesystemRepositoryManager(this.repositories_node);
    this.git = new GitRepositoryManager(this.repositories_node);

    // If not exist fetch the core repository
    this.fetchCoreRepository();

    // Print scan result
    log.info(this.repositories_node.toString());
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
   * Returns the names of the repositories.
   * @function
   * @name MediaRepositoryManager.getRepositoryNames
   * @return {Array<string>}
   */
  getRepositoryNames() {
    return this.repositories_node.getChildNames();
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

  /**
   * Scans the default media path for media repositories.
   * @function
   * @name MediaRepositoryManager.scanAll
   */
  scan() {
    this.fs.scan();
    this.git.scan();
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name MediaRepositoryManager.scanAll
   */
  scanAll() {
    var media_paths = inexor_path.getMediaPaths();
    for (var i = 0; i < media_paths.length; i++) {
      this.fs.scan(media_paths[i]);
      this.git.scan(media_paths[i]);
    }
  }

  /**
   * Returns the type of a media repository.
   * @function
   * @name MediaRepositoryManager.getType
   */
  getType(name) {
    return this.repositories_node.getChild(name).type;
  }

  /**
   * Updates the media repository with the given name.
   * @function
   * @name MediaRepositoryManager.update
   * @param {string} name - The name of the media repository
   * @param {string} branch_name - The name of the branch
   */
  update(name, branch_name = null) {
    switch (this.getType(name)) {
      case 'fs':
        this.fs.update(name);
        break;
      case 'git':
        this.git.update(name, branch_name, false);
        break;
    }
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

  /**
   * Fetches the core repository if not already available.
   * @function
   * @name MediaRepositoryManager.fetchCoreRepository
   */
  fetchCoreRepository() {
    if (!this.exists('core')) {
      this.git.createRepository('core', this.getRepositoryPath('core'), 'https://github.com/inexor-game/data.git');
    }
  }

  /**
   * Returns the default repository path for the given repository name.
   * @function
   * @name MediaRepositoryManager.getRepositoryPath
   * @param {string} name - The name of the media repository
   */
  getRepositoryPath(name) {
    return path.join(inexor_path.media_path, name);
  }

}

module.exports = {
  MediaRepositoryManager: MediaRepositoryManager,
  FilesystemRepositoryManager: FilesystemRepositoryManager,
  GitRepositoryManager: GitRepositoryManager,
  repository_types: repository_types
}
