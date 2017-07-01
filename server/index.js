#!/usr/bin/env node

const FlexArgs = require('./FlexArgs');
const PidManager = require('./PidManager');
const ProcessManager = require('./ProcessManager');
const FlexServer = require('./FlexServer');

const inexor_path = require('@inexor-game/path');
const inexor_logger = require('@inexor-game/logger');

let flexArgs = new FlexArgs();
let pidManager = new PidManager(flexArgs.argv);
let processManager = new ProcessManager(flexArgs.argv, pidManager);
let flexServer = new FlexServer(flexArgs.argv, pidManager, processManager);
