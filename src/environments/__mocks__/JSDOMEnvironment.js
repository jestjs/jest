// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

const utils = require.requireActual('../../lib/utils');
const vm = require.requireActual('vm');

const JSDOMEnvironment = jest.genMockFromModule('../JSDOMEnvironment');

JSDOMEnvironment.mockImplementation(function(config) {
  this.global = {
    console: {},
    mockClearTimers: jest.genMockFn(),
    JSON,
  };

  const globalValues = utils.deepCopy(config.globals);
  for (const customGlobalKey in globalValues) {
    this.global[customGlobalKey] = globalValues[customGlobalKey];
  }
});

JSDOMEnvironment.prototype.runSourceText.mockImplementation(
  function(sourceText, filename) {
    return vm.runInNewContext(sourceText, this.global, {
      filename,
      displayErrors: false,
    });
  }
);

module.exports = JSDOMEnvironment;
