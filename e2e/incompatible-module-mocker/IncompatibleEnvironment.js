/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const NodeEnvironment = require('jest-environment-node').default;

// Simulates an old test environment (e.g. jest-environment-jsdom@29.x backed by
// jest-mock@29.x) whose moduleMocker does not have the clearMocksOnScope method
// that was introduced in jest-mock 30.4.0.
class IncompatibleEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    Object.defineProperty(this.moduleMocker, 'clearMocksOnScope', {
      configurable: true,
      value: undefined,
    });
  }
}

module.exports = IncompatibleEnvironment;
