// API dependencies
const express = require('express');
const bodyParser = require('body-parser');

// Plugin dependencies
const pack = require('./package.json');
var IoC = require('electrolyte');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

plugins = {};
IoC.use(IoC.node_modules()); // Require components from the same directory
Ioc.use(Ioc.)

Object.keys(pack.dependencies).forEach((key) => {
  if (String(key).includes('@inexor-plugins/')) {
    let name = key.split('/')[1]; // Everything after @inexor-plugins/
    let component = IoC.create(name); // Should require the folder
    plugins[name] = component;
  }
})

module.exports = router;
