exports = module.exports = function(router) {
  router.get('xy', function(req, res) {
    res.status(200);
  })

  return router;
}

exports['@routable'] = true;
