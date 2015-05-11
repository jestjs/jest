'use strict';

var utils = require.requireActual('../lib/utils');
var vm = require.requireActual('vm');

var JSDomEnvironmentMock = jest.genMockFromModule('../JSDomEnvironment');

JSDomEnvironmentMock.mockImplementation(function(config) {
  this.global = {
    console: {},
    mockClearTimers: jest.genMockFn(),
    JSON: JSON,
  };

  var globalValues = utils.deepCopy(config.globals);
  for (var customGlobalKey in globalValues) {
    this.global[customGlobalKey] = globalValues[customGlobalKey];
  }
});

JSDomEnvironmentMock.prototype.runSourceText.mockImplementation(
  function(codeStr, fileName) {
    vm.runInNewContext(codeStr, this.global, {
      filename: fileName,
      displayErrors: false,
    });
  }
);

module.exports = JSDomEnvironmentMock;
