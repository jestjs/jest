/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const vm = require.requireActual('vm');

const JSDOMEnvironment = jest.genMockFromModule('../index');

JSDOMEnvironment.mockImplementation(function(config) {
  this.global = {
    JSON,
    console: {},
    mockClearTimers: jest.genMockFn(),
  };

  const globalValues = Object.assign({}, config.globals);
  for (const customGlobalKey in globalValues) {
    this.global[customGlobalKey] = globalValues[customGlobalKey];
  }
});

JSDOMEnvironment.prototype.runSourceText.mockImplementation(function(
  sourceText,
  filename,
) {
  return vm.runInNewContext(sourceText, this.global, {
    displayErrors: false,
    filename,
  });
});

module.exports = JSDOMEnvironment;
