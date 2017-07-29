const express = require('express');
const process = require('process');
const util = require('util');

const inexor_log = require('@inexorgame/logger');
const log = inexor_log('@inexorgame/flex/api/v1/profiles');

/**
 * REST API for managing profiles.
 */
class ProfilesRestAPI {

  /**
   * Constructs the ProfilesRestAPI.
   */
  constructor(applicationContext) {

    // The express router
    this.router = applicationContext.get('router');

    // The Inexor Tree
    this.root = applicationContext.get('tree');

    // The instance manager
    this.profileManager = applicationContext.get('profileManager');

    // The tree node which contains all instance nodes
    this.profilesNode = this.root.getOrCreateNode('profiles');

    // Lists all available profiles
    this.router.get('/profiles', this.listProfiles.bind(this));

    // Returns a profile
    this.router.get('/profiles/:name', this.dumpProfilesTree.bind(this));

    // Creates a new profile
    this.router.post('/profiles/:name', this.createProfile.bind(this));

    // Removes a profile
    this.router.delete('/profiles/:name', this.removeProfile.bind(this));

    // Switches to profile
    this.router.get('/profiles/:name/switch', this.switchToProfile.bind(this));

  }

  /**
   * Lists all profiles.
   */
  listProfiles(req, res) {
    let profiles = this.profilesNode.getChildNames();
    profiles.shift();
    profiles.shift();
    res.status(200).json(profiles);
  }

  /**
   * Dumps the subtree of the instance.
   */
  dumpProfilesTree(req, res) {
    if (this.profilesNode.hasChild(req.params.name)) {
      let profileNode = this.profilesNode.getChild(req.params.name);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(profileNode.toObject());
    } else {
      res.status(404).send(util.format('Profile %s was not found', req.params.name));
    }
  }

  /**
   * Creates a new profile.
   * Returns HTTP status code 201 and the profile object if the profile was created.
   * Returns HTTP status code 409 if the profile already exists
   * Returns HTTP status code 400 if the request has wrong parameters
   * Returns HTTP status code 500 if the profile couldn't be created
   */
  createProfile(req, res) {
    if (!this.profilesNode.hasChild(req.params.name)) {
      this.profileManager
        .create(req.params.name, req.body.hostname, req.body.port)
        .then((profileNode) => {
          res.status(201).json(profileNode.toJson());
        }).catch((err) => {
          // Failed to create the instance
          log.error(util.format('Failed to create profile %s: %s', req.params.name, err.message));
          res.status(500).send(err);
        });
    } else {
      // The profile already exists!
      res.status(409).send(util.format('Profile %s already exists.', req.params.name));
    }
  }

  /**
   * Removes the profile with the given name.
   * Returns HTTP status code 204 if the profile was successfully removed
   * Returns HTTP status code 404 if there is no profile with the given name.
   */
  removeProfile(req, res) {
    if (this.profilesNode.hasChild(req.params.name)) {
      this.profilesNode.removeChild(req.params.name);
      // Successfully removed
      res.status(204).send({});
    } else {
      res.status(404).send(util.format('Profile %s was not found', req.params.name));
    }
  }

  /**
   * Switches to the profile with the given name.
   * Returns the profile object.
   * Returns HTTP status code 404 if there is no profile with the given name.
   * Returns HTTP status code 500 if switching failed.
   */
  switchToProfile(req, res) {
    if (this.profilesNode.hasChild(req.params.name)) {
      this.profileManager.switchTo(req.params.name).then((profileNode) => {
        res.status(200).send(profileNode.toJson());
      }).catch((err) => {
        log.error(err);
        res.status(500).send(err);
      })
    } else {
      res.status(404).send(util.format('Cannot switch to profile. Profile %s was not found', req.params.name));
    }
  }

}

module.exports = ProfilesRestAPI;
