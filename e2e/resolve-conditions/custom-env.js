/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const NodeEnv = require('jest-environment-node').TestEnvironment;

module.exports = class CustomEnvWithConditions extends NodeEnv {
  customExportConditions = ['deno'];
};
