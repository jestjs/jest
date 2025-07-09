/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const NodeEnvironment = require('jest-environment-node').default;

class EnvironmentWithTeardownError extends NodeEnvironment {
  async teardown() {
    await super.teardown();
    throw new Error('teardown error from custom environment');
  }
}

module.exports = EnvironmentWithTeardownError;
