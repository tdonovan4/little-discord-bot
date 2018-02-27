const sinon = require('sinon');
var args = require('../src/args.js');

exports.setTestConfig = function() {
  newConfig = args.getConfig();

  //Add some test values
  newConfig[1].locale = 'en-US';
  newConfig[1].pathDatabase = './test/test-resources/test-database.db';

  stubConfig = sinon.stub(args, 'getConfig');
  stubConfig.returns([newConfig[0], newConfig[1]]);
}
