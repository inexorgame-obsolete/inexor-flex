const httpMocks = require('node-mocks-http');

exports.command = "initialize"
exports.describe = "Fires up a default Inexor Core client"

exports.handler = (argv) => {
  let instance  = httpMocks.createRequest({
    method: 'GET',
    url: 'localhost:31416/instance/create',
  });

  
}
