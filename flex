#!/usr/bin/env node
const argv = require('yargs')
  .commandDir('server/commands/cli/')
  .help()
  .argv
