const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const git = require('nodegit');
const util = require('util');
const tree = require('@inexor-game/tree');
const mkdirp = require('mkdirp');

const inexor_path = require('@inexor-game/path');

/**
 * The media repository types.
 * Future types may be 'http+rest', 'mongo'
 */
const repository_types = [
  'fs',
  'git'
];

class FilesystemRepositoryManager extends EventEmitter {

  /**
   * Constructs the FilesystemRepositoryManager.
   * @constructor
   * @param {tree.Node} repositoriesNode - The repositories tree node.
   */
  constructor(applicationContext) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// Creating a tree node containing the media repositories
    this.repositoriesNode = this.mediaNode.getOrCreateNode('repositories');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.repository.FilesystemRepositoryManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    /// Scan for filesystem repositories
    /// this.scanAll();

  }

  /**
   * Scans the file system for media repositories starting at the base dir.
   * @function
   * @name FilesystemRepositoryManager.scan
   * @param {string} mediaPath - The starting point for scanning.
   * @return An array containing the created repository nodes.
   */
  scan(mediaPath = null) {
    var nodes = [];
    var _mediaPath = mediaPath;
    if (_mediaPath == null) {
      _mediaPath = inexor_path.media_path;
    }
    var self = this;
    if (fs.existsSync(_mediaPath)) {
      try {
        this.log.debug(util.format('Scaning media path %s for FS media repositories', _mediaPath));
        let subDirs = this.get_sub_directories(_mediaPath);
        for (let i = 0; i < subDirs.length; i++) {
          let repository_name = subDirs[i];
          var repository_dir = path.join(_mediaPath, repository_name);
          if (!this.exists(repository_name)) {
            try {
              let node = this.addRepository(repository_name, repository_dir);
              if (node != null) {
                nodes.push(node);
                this.log.info(util.format('Added FS media repository %s: %s', repository_name, repository_dir));
              }
            } catch (err) {
              this.log.warn(err.message);
            }
          } else {
            this.log.debug(util.format('Skipping known media repository %s: %s', repository_name, repository_dir));
          }
        }
      } catch (err) {
        this.log.warn(util.format('Failed to scan media path %s: %s', _mediaPath, err.message));
      }
    } else {
      this.log.debug(util.format('Path does not exist: %s ', _mediaPath));
    }
    return nodes;
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name FilesystemRepositoryManager.scanAll
   */
  scanAll() {
    var mediaPaths = inexor_path.getMediaPaths();
    for (var i = 0; i < mediaPaths.length; i++) {
      this.scan(mediaPaths[i]);
    }
  }

  /**
   * Returns true if a media repository exists in the Inexor Tree.
   * @function
   * @name FilesystemRepositoryManager.exists
   * @return {boolean}
   */
  exists(name) {
    return this.repositoriesNode.hasChild(name);
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
   * @param {string} repositoryPath - The absolute path to the base folder of the media repository.
   * @return {Node} The repository node.
   */
  addRepository(name, repositoryPath) {
    if (name != null && repositoryPath != null) {
      if (!this.exists(name)) {
        if (fs.existsSync(repositoryPath)) {
          if (!fs.existsSync(path.join(repositoryPath, '.git'))) {
            let node = this.repositoriesNode.addNode(name);
            node.addChild('type', 'string', 'filesystem');
            node.addChild('path', 'string', repositoryPath);
            return node;
          } else {
            // Prevent registering a repository of type GIT as a FS repository;
            return null;
          }
        } else {
          throw new Error('Directory doesn\'t exist: ' + repositoryPath);
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
   * @param {string} repositoryPath - The absolute path to the base folder of the media repository.
   * @return {Node} The repository node.
   */
  createRepository(name, repositoryPath) {
    if (name != null && repositoryPath != null) {
      if (!this.exists(name)) {
        if (!fs.existsSync(repositoryPath)) {
          let node = this.repositoriesNode.addNode(name);
          node.addChild('type', 'string', 'filesystem');
          node.addChild('path', 'string', repositoryPath);
          fs.mkdirSync(repositoryPath);
          return node;
        } else {
          throw new Error('The given path already exists: ' + repositoryPath);
        }
      } else {
        throw new Error('A repository with name ' + name + ' already exists!');
      }
    } else {
      throw new Error('Name and path are mandatory!');
    }
  }

}

class GitRepositoryManager extends EventEmitter {

  /**
   * Constructs the FilesystemRepositoryManager.
   * @constructor
   * @param {tree.Node} repositoriesNode - The repositories tree node.
   */
  constructor(applicationContext) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// Creating a tree node containing the media repositories
    this.repositoriesNode = this.mediaNode.getOrCreateNode('repositories');

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.repository.GitRepositoryManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    /// Scan for filesystem repositories
    /// this.scanAll();

  }

  /**
   * Scans the file system for media repositories starting at the base dir.
   * @function
   * @name GitRepositoryManager.scan
   * @param {string} mediaPath - The starting point for scanning.
   * @return An array containing the created repository nodes.
   */
  scan(mediaPath = null) {
    var nodes = [];
    var _mediaPath = mediaPath;
    if (_mediaPath == null) {
      _mediaPath = inexor_path.media_path;
    }
    if (fs.existsSync(_mediaPath)) {
      try {
        this.log.debug(util.format('Scaning media path %s for GIT media repositories', _mediaPath));
        let subDirs = this.get_sub_directories(_mediaPath);
        for (let i = 0; i < subDirs.length; i++) {
          let repository_name = subDirs[i];
          var repository_dir = path.join(_mediaPath, repository_name);
          if (!this.exists(repository_name)) {
            try {
              let node = this.addRepository(repository_name, repository_dir);
              nodes.push(node);
              this.log.info(util.format('Added GIT media repository %s: %s', repository_name, repository_dir));
            } catch (err) {
              this.log.warn(err.message);
            }
          } else {
            this.log.debug(util.format('Skipping known media repository %s: %s', repository_name, repository_dir));
          }
        }
      } catch (err) {
        this.log.warn(util.format('Failed to scan media path %s: %s', _mediaPath, err.message));
      }
    } else {
      this.log.debug(util.format('Path does not exist: %s ', _mediaPath));
    }
    return nodes;
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name GitRepositoryManager.scanAll
   */
  scanAll() {
    var mediaPaths = inexor_path.getMediaPaths();
    for (var i = 0; i < mediaPaths.length; i++) {
      this.scan(mediaPaths[i]);
    }
  }

  /**
   * Returns true if a media repository exists in the Inexor Tree.
   * @function
   * @name GitRepositoryManager.exists
   * @return {boolean}
   */
  exists(name) {
    return this.repositoriesNode.hasChild(name);
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
   * @param {string} repositoryPath - The absolute path to the base folder of the media repository.
   * --------- @param {string} url - The url of the remote GIT repository. ---------
   * @return {Node} The repository node.
   */
  addRepository(name, repositoryPath /*, url */) {
    if (name != null && repositoryPath != null) {
      if (!this.exists(name)) {
        if (fs.existsSync(repositoryPath)) {
          if (this.isGitRepository(repositoryPath)) {
            let node = this.repositoriesNode.addNode(name);
            node.addChild('type', 'string', 'git');
            node.addChild('path', 'string', repositoryPath);
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
          throw new Error('Directory doesn\'t exist: ' + repositoryPath);
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
   * @param {string} repositoryPath - The absolute path to the base folder of the media repository.
   * @return {boolean} The repository node.
   */
  isGitRepository(repositoryPath) {
    return fs.existsSync(path.join(repositoryPath, '.git'))
  }

  /**
   * Creates a new git repository. The local path must not exist. After creation the
   * @function
   * @name GitRepositoryManager.createRepository
   * @param {string} name - The name of the media repository
   * @param {string} repositoryPath - The absolute path to the base folder of the media repository.
   * @param {string} url - The url of the remote GIT repository.
   * @return {Node} The repository node.
   */
  createRepository(name, repositoryPath, url) {
    if (name != null && repositoryPath != null) {
      if (!this.exists(name)) {
        if (!fs.existsSync(repositoryPath)) {
          let node = this.repositoriesNode.addNode(name);
          // TODO: use the javascript getter/setter magic!
          // node.type = 'git';
          node.addChild('type', 'string', 'git');
          node.addChild('path', 'string', repositoryPath);
          node.addChild('url', 'string', url);
          node.addChild('branch', 'string', 'master');
          node.addNode('branches');
          // Initially clone the repository
          this.update(name, null, true);
          return node;
        } else {
          throw new Error('Directory already exist: ' + repositoryPath);
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
    let repositoryNode = this.repositoriesNode.getChild(name);
    let repositoryPath = this.repositoriesNode.getChild(name).path;
    var self = this;
    if (clone) {
      // git clone
      this.log.info(util.format('Cloning media repository %s from %s to local path %s', name, repositoryNode.url, repositoryNode.path));
      var self = this;
      var repository;
      git.Clone(repositoryNode.url, repositoryNode.path, {
        fetchOpts: {
          callbacks: {
            certificateCheck: function() {
              return 1;
            }
          }
        }
      }).then(function(repo) {
        repository = repo;
        self.log.info(util.format('Successfully cloned media repository %s', name));
        return self.getBranches(name, repository);
      }).then(function(repository) {
        return self.getCurrentBranch(name, repository);
      }).catch(function(err) {
        self.log.error(err);
      });
    } else {
      // git pull
      // TODO: Resolve the repository url first!
      this.log.debug(util.format('[%s] Updating media repository (url: %s local: %s)', name, repositoryNode.url, repositoryNode.path));
      var self = this;
      var repository;
      git.Repository
        .open(repositoryPath)
        .then(function(repo) {
          repository = repo;
          self.log.debug(util.format('[%s] Opened media repository', name));
          return self.getBranches(name, repository);
        })
        .then(function(repository) {
          self.log.debug(util.format('[%s] Got branches', name));
          return self.getCurrentBranch(name, repository);
        })
        .then(function(repository) {
          self.log.debug(util.format('[%s] Got current branch', name));
          return self.fetchAll(name, repository);
        })
        .then(function(repository) {
          self.log.debug(util.format('[%s] Fetched changes from remote', name));
          return self.mergeBranches(name, repository);
        })
        .then(function(repository) {
          self.log.debug(util.format('[%s] Merged changes into local branch', name));
          if (branch_name != null) {
            return self.checkoutBranch(name, repository, branch_name);
          } else {
            return repository;
          }
        })
        .done(function() {
          self.log.info(util.format('[%s] Successfully updated media repository', name));
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
    this.log.debug(util.format('[%s] Fetching new data from remote', name));
    var self = this;
    return repository
      .fetchAll({
        callbacks: {
          certificateCheck: function() {
            return 1;
          }
        }
      })
      .then(function() {
        self.log.debug(util.format('[%s] Successfully fetched data', name));
        return repository;
      })
      .catch(function() {
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
    let branchNode = this.repositoriesNode.getChild(name).branch;
    let branchesNode = this.repositoriesNode.getChild(name).branches;
    let local_branch = branchesNode.getChild(branchNode).local;
    let local = local_branch.substr(11);
    let remote_branch = branchesNode.getChild(branchNode).remote;
    let remote = remote_branch.substr(13);
    this.log.debug(util.format('[%s] Merging new data from remote branch %s into local branch %s', name, remote, local));
    var self = this;
    return repository
      .mergeBranches(local, remote)
      .then(function() {
        self.log.debug(util.format('[%s] Successfully merged new data', name));
        return repository;
      })
      .catch(function() {
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
    let branchNode = this.repositoriesNode.getChild(name).branch;
    var self = this;
    return repository
      .getBranch('refs/remotes/origin/' + branch_name)
      .then(function(reference) {
        let branch_name = reference.toString().substr(20);
        if (branch_name == '') {
          branch_name = 'master';
        }
        self.log.info(util.format('[%s] Checking out branch %s (%s)', name, branch_name, reference.toString()));
        branchNode = branch_name;
        return repository
          .checkoutBranch(branch_name)
          .then(function() {
            this.log.info(util.format('[%s] Successfully checked out branch %s (%s)', name, branch_name, reference.toString()));
            return repository;
          })
          .catch(function(err) {
            self.log.info(err);
            return repository
              .checkoutRef(reference)
              .then(function(commit) {
                self.log.debug("creating local branch");
                return repository
                  .getHeadCommit()
                  .then(function(commit) {
                    return repository
                      .createBranch(branch_name, commit, true)
                      .then(function(reference) {
                        self.log.debug(util.format('[%s] Successfully created local branch %s (%s)', name, branch_name, reference.toString()));
                        return repository
                          .checkoutBranch(branch_name)
                          .then(function() {
                            self.log.debug(util.format('[%s] Successfully checked out branch %s (%s)', name, branch_name, reference.toString()));
                            return repository;
                          })
                          .catch(function() {
                            return repository;
                          });
                      })
                      .catch(function() {
                        return repository;
                      });
                  })
                  .catch(function() {
                    return repository;
                  });
              })
              .catch(function() {
                return repository;
              });
          });
      })
      .catch(function() {
        return repository;
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
    let branchNode = this.repositoriesNode.getChild(name).branch;
    var self = this;
    return repository
      .getCurrentBranch()
      .then(function(reference) {
        try {
          let branch_name = reference.toString().substr(11);
          if (branch_name != '') {
            branchNode = branch_name;
            self.log.debug(util.format('[%s] Current branch is %s', name, branch_name));
          } else {
            branchNode = 'master';
            self.log.warn(util.format('[%s] Failed to get current branch, assuming master branch!', name));
          }
        } catch (err) {
          branchNode = 'master';
          self.log.error(util.format('[%s] Failed to get current branch', name));
        }
        return repository;
      })
      .catch(function(reference) {
        self.log.warn(util.format('[%s] Failed to get current branch, assuming master branch!', name));
        branchNode = 'master';
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
    let repositoryNode = this.repositoriesNode.getChild(name);
    let branchesNode = this.repositoriesNode.getChild(name).branches;
    var self = this;
    return repository
      .getReferenceNames(git.Reference.TYPE.LISTALL)
      .then(function(reference_names) {
        try {
          for (var i = 0; i < reference_names.length; i++) {
            var reference_name = reference_names[i];
            if (reference_name.substr(0, 11) == 'refs/heads/') {
              // local branch
              var branch_name = reference_name.substr(11);
              var branchNode;
              if (branchesNode.hasChild(branch_name)) {
                branchNode = branchesNode.getChild(branch_name);
              } else {
                branchNode = branchesNode.addNode(branch_name);
              }
              if (branchNode.hasChild('local')) {
                branchNode.getChild('local').set(reference_name);
              } else {
                branchNode.addChild('local', 'string', reference_name);
              }
              self.log.debug(util.format('[%s] Found local branch %s', name, branch_name));
            } else if (reference_name.substr(0, 20) == 'refs/remotes/origin/') {
              // remote branch
              var branch_name = reference_name.substr(20);
              var branchNode;
              if (branchesNode.hasChild(branch_name)) {
                branchNode = branchesNode.getChild(branch_name);
              } else {
                branchNode = branchesNode.addNode(branch_name);
              }
              if (branchNode.hasChild('remote')) {
                branchNode.getChild('remote').set(reference_name);
              } else {
                branchNode.addChild('remote', 'string', reference_name);
              }
              self.log.debug(util.format('[%s] Found remote branch %s', name, branch_name));
            }
          }
          self.log.debug(branchesNode.toString());
        } catch (err) {
          self.log.error(util.format('[%s] Failed to get available branches: %s', name, err));
        }
        return repository;
      })
      .catch(function() {
        return repository;
      });
  }

}

/**
 * The MediaRepositoryManager manages the media repositories. The repositories
 * can be repositories in the local file system or public remote repositories.
 */
class MediaRepositoryManager extends EventEmitter {

  /**
   * Constructs the MediaRepositoryManager.
   * @constructor
   * @param {ApplicationContext} application_context - The application context.
   */
  constructor(application_context) {
    super();
  }

  /**
   * Sets the dependencies from the application context.
   */
  setDependencies() {

    /// The file system repository manager
    this.filesystemRepositoryManager = this.applicationContext.get('filesystemRepositoryManager');

    /// The file system repository manager
    this.gitRepositoryManager = this.applicationContext.get('gitRepositoryManager');

    /// The Inexor Tree root node
    this.root = this.applicationContext.get('tree');

    /// The Inexor Tree node containing media
    this.mediaNode = this.root.getOrCreateNode('media');

    /// Creating a tree node containing the media repositories
    this.repositoriesNode = this.mediaNode.getOrCreateNode('repositories');

    /// Ensure that the default media path exists
    mkdirp.sync(inexor_path.media_path);

    /// Publish the media paths on the Inexor Tree
    this.pathsNode = this.mediaNode.getOrCreateNode('paths');
    let mediaPaths = inexor_path.getMediaPaths();
    for (let i = 0; i < mediaPaths.length; i++) {
      this.pathsNode.addChild(String(i), 'string', mediaPaths[i]);
    }

    /// The class logger
    this.log = this.applicationContext.get('logManager').getLogger('flex.media.repository.MediaRepositoryManager');

  }

  /**
   * Initialization after the components in the application context have been
   * constructed.
   */
  afterPropertiesSet() {

    /// Print the repository paths
    this.log.info(util.format('Repository paths: %s', this.pathsNode.toJson()));

    /// Scan all media paths
    this.scanAll();

    /// Print the scan result
    this.log.info(util.format('Repository scan result: %s', this.repositoriesNode.toJson()));

    // If not exist fetch the core repository
    this.fetchCoreRepository();

  }

  /**
   * Returns the Inexor Tree node which contains all repository nodes.
   * @function
   * @name MediaRepositoryManager.getRepositoriesNode
   * @return {Node} - The Inexor Tree node which contains all repository nodes.
   */
  getRepositoriesNode() {
    return this.repositoriesNode;
  }

  /**
   * Returns the names of the repositories.
   * @function
   * @name MediaRepositoryManager.getRepositoryNames
   * @return {Array<string>}
   */
  getRepositoryNames() {
    return this.repositoriesNode.getChildNames();
  }

  /**
   * Returns true, if a repository with the given name exists in the Inexor Tree.
   * @function
   * @name MediaRepositoryManager.exists
   * @param {string} name - The name of the media repository
   * @return {bool} True, if a repository with the given name exists in the Inexor Tree.
   */
  exists(name) {
    return this.repositoriesNode.hasChild(name);
  }

  /**
   * Scans the default media path for media repositories.
   * @function
   * @name MediaRepositoryManager.scanAll
   */
  scan() {
    this.filesystemRepositoryManager.scan();
    this.gitRepositoryManager.scan();
  }

  /**
   * Scans all media paths. This includes system wide repositories (for
   * example in /usr/local/share/).
   * @function
   * @name MediaRepositoryManager.scanAll
   */
  scanAll() {
    let mediaPaths = inexor_path.getMediaPaths();
    for (var i = 0; i < mediaPaths.length; i++) {
      this.filesystemRepositoryManager.scan(mediaPaths[i]);
      this.gitRepositoryManager.scan(mediaPaths[i]);
    }
  }

  /**
   * Returns the type of a media repository.
   * @function
   * @name MediaRepositoryManager.getType
   */
  getType(name) {
    return this.repositoriesNode.getChild(name).type;
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
        this.filesystemRepositoryManager.update(name);
        break;
      case 'git':
        this.gitRepositoryManager.update(name, branch_name, false);
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
      this.repositoriesNode.removeChild(name);
    }
  }

  /**
   * Fetches the core repository if not already available.
   * @function
   * @name MediaRepositoryManager.fetchCoreRepository
   */
  fetchCoreRepository() {
    if (!this.exists('core')) {
      // Clones the core media repository
      this.gitRepositoryManager.createRepository('core', this.getRepositoryPath('core'), 'https://github.com/inexorgame/data.git');
    }
    if (!this.exists('user')) {
      // Creates a personal media repository for the current user
      this.filesystemRepositoryManager.createRepository('user', this.getRepositoryPath('user'));
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
