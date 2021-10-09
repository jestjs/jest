/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const BrowserEnv = require('jest-environment-jsdom');

module.exports = class BrowserEnvWithConditions extends BrowserEnv {
  exportConditions() {
    return ['browser'];
  }
};
