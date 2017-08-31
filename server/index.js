#!/usr/bin/env node

const FlexArgs = require('./FlexArgs');
const PidManager = require('./PidManager');
const ProcessManager = require('./ProcessManager');
const FlexServer = require('./FlexServer');

let flexArgs = new FlexArgs();
let pidManager = new PidManager(flexArgs.argv);
let processManager = new ProcessManager(flexArgs.argv, pidManager);
let flexServer = new FlexServer(flexArgs.argv, pidManager, processManager);
flexServer.start();
