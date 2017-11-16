const path = require('path');
const util = require('util');
const inexor_path = require('@inexorgame/path');

/**
 * REST API for media repositories.
 * @module api
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
      let repository_path = path.join(inexor_path.media_path, req.params.name);
      switch (req.body.type) {
        case 'fs': {
          this.mediaRepositoryManager.filesystemRepositoryManager.createRepository(req.params.name, repository_path).then((repository_node) => {
            res.status(201).json(repository_node.get());
          }).catch((err) => {
            res.status(400).json(err);
          });
          break;
        }
        case 'git': {
          if (req.body.url != null) {
            this.mediaRepositoryManager.gitRepositoryManager.createRepository(req.params.name, repository_path, req.body.url).then((repository_node) => {
                res.status(201).json(repository_node.get());
            }).catch((err) => {
                res.status(400).json(err);
            });
          } else {
            res.status(500).send(util.format('Missing parameter: url'));
          }
          break;
        }
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
