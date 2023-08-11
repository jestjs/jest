/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const JsdomEnv = require('jest-environment-jsdom').TestEnvironment;

module.exports = class CustomEnvWithConditions extends JsdomEnv {
  exportConditions() {
    return ['deno'];
  }
};
