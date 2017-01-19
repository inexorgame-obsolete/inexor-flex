const expect = require('chai').expect;
const tree = require('@inexor-game/tree');
const manager = require('../');

/**
 * Verified to work but somehow the test suite throws exceptions on OSX currently
 * Stack trace as below
 * Unhandled rejection Error: Invalid listen argument: [object Object]
    at Server.listen (net.js:1384:13)
    at Object.<anonymous> (/Users/berger/workspace/flex/node_modules/portastic/lib/portastic.js:46:12)
    at Object.tryCatcher (/Users/berger/workspace/flex/node_modules/bluebird/js/main/util.js:26:23)
    at Object.test (/Users/berger/workspace/flex/node_modules/bluebird/js/main/method.js:15:34)
    at resolvePort (/Users/berger/workspace/flex/src/manager/index.js:52:17)
    at Promise (/Users/berger/workspace/flex/src/manager/index.js:88:5)
    at Object.create (/Users/berger/workspace/flex/src/manager/index.js:36:10)
    at Context.<anonymous> (/Users/berger/workspace/flex/src/manager/test/manager_test.js:8:22)
    at callFn (/Users/berger/workspace/flex/node_modules/mocha/lib/runnable.js:345:21)
    at Test.Runnable.run (/Users/berger/workspace/flex/node_modules/mocha/lib/runnable.js:337:7)
    at Runner.runTest (/Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:444:10)
    at /Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:550:12
    at next (/Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:361:14)
    at /Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:371:7
    at next (/Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:295:14)
    at Immediate.<anonymous> (/Users/berger/workspace/flex/node_modules/mocha/lib/runner.js:339:5)
    at runCallback (timers.js:651:20)
    at tryOnImmediate (timers.js:624:5)
    at processImmediate [as _immediateCallback] (timers.js:596:5)
 */
describe('Manager', function() {
  describe('create', function() {
    it.skip('should create an instance', function() {
      expect(manager.create('gabbagecli')).to.be.fulfilled;
    })

    it.skip('should contain a valid Node instance after creation', function() {
      manager.create('gabbagecli').then((instance) => {
        expect(instance.tree).to.be.an.instanceof(tree.Node);
      })
    })
  })
})
