/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const vm = jest.requireActual('vm');

const JSDOMEnvironment = jest.genMockFromModule('../index') as jest.Mock;

JSDOMEnvironment.mockImplementation(function(config) {
  // @ts-ignore
  this.global = {
    JSON,
    console: {},
  };

  const globalValues = {...config.globals};
  for (const customGlobalKey in globalValues) {
    // @ts-ignore
    this.global[customGlobalKey] = globalValues[customGlobalKey];
  }
});

JSDOMEnvironment.prototype.runSourceText.mockImplementation(function(
  sourceText: string,
  filename: string,
) {
  // @ts-ignore
  return vm.runInNewContext(sourceText, this.global, {
    displayErrors: false,
    filename,
  });
});

module.exports = JSDOMEnvironment;
