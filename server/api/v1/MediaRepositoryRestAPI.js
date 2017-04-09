const path = require('path');
const inexor_path = require('@inexor-game/path');

const media = require('@inexor-game/media');

/**
 * REST API for media repositories.
 */
class MediaRepositoryRestAPI {

  /**
   * Constructs the media repository REST API.
   */
  constructor(applicationContext) {
    
    // The media repository manager
    this.mediaRepositoryManager = applicationContext.get('mediaRepositoryManager');
    
    // The express router
    this.router = applicationContext.get('router');

    // Scans for media repositories.
    this.router.post('/media/repositories', this.scanMediaRepositories.bind(this));

    // Creates a new media repository.
    this.router.post('/media/repositories/:name', this.createMediaRepository.bind(this));

    // Updates a media repository.
    this.router.put('/media/repositories/:name', this.updateMediaRepository.bind(this));

    // Updates a media repository.
    this.router.put('/media/repositories/:name/:branchName', this.updateMediaRepositoryBranch.bind(this));

    // Removes a media repository.
    this.router.delete('/media/repositories/:name', this.removeMediaRepository.bind(this));

  }

  /**
   * Scans for media repositories.
   * 
   * TODO: use promises.
   * TODO: improve result
   * 
   */
  scanMediaRepositories(req, res) {
    this.mediaRepositoryManager.scanAll();
    res.status(200).send({});
  }

  /**
   * Creates a new media repository.
   * 
   * TODO: use promises.
   * 
   */
  createMediaRepository(req, res) {
    if (req.body.type != null) {
      let repository_path = path.resolve(path.join(path.join(inexor_path.getBasePath(), inexor_path.media_path), req.params.name));
      switch (req.body.type) {
        case 'fs':
          let repository_node = this.mediaRepositoryManager.fs.createRepository(req.params.name, repository_path);
          res.status(201).json(repository_node.get());
          break;
        case 'git':
          if (req.body.url != null) {
            let repository_node = this.mediaRepositoryManager.git.createRepository(req.params.name, repository_path, req.body.url);
            res.status(201).json(repository_node.get());
          } else {
            res.status(500).send(util.format('Missing parameter: url'));
          }
          break;
      }
    } else {
      res.status(500).send(util.format('Missing parameter: type'));
    }
  }

  /**
   * Updates a media repository.
   * 
   * TODO: use promises.
   * TODO: improve result
   * 
   */
  updateMediaRepository(req, res) {
    if (this.mediaRepositoryManager.exists(req.params.name)) {
      this.mediaRepositoryManager.update(req.params.name);
      res.status(200).send({});
    } else {
      res.status(404).send(util.format('Media repository %s was not found', req.params.name));
    }
  }

  /**
   * Updates the media repository branch.
   * 
   * TODO: use promises.
   * TODO: improve result
   * 
   */
  updateMediaRepositoryBranch(req, res) {
    if (this.mediaRepositoryManager.exists(req.params.name)) {
      this.mediaRepositoryManager.update(req.params.name, req.params.branchName);
      res.status(200).send({});
    } else {
      res.status(404).send(util.format('Media repository %s was not found', req.params.name));
    }
  }

  /**
   * Removes a media repository.
   * 
   * TODO: use promises.
   * TODO: improve result
   * 
   */
  removeMediaRepository(req, res) {
    if (this.mediaRepositoryManager.exists(req.params.name)) {
      this.mediaRepositoryManager.remove(req.params.name);
      // Successfully removed
      res.status(204).send({});
    } else {
      res.status(404).send(util.format('Media repository %s was not found', req.params.name));
    }
  }

}

module.exports = MediaRepositoryRestAPI;
