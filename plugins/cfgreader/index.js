const util = require('util');
const debuglog = util.debuglog('cfgreader');

exports = module.exports = function(router) {
  debuglog('Got a new router object [%o]', router);

  router.get('/xy', function(req, res) {
    res.status(200).json("yo");
  })

  return router;
}

exports['@routable'] = true;
