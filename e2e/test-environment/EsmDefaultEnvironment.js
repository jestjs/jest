/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

exports.__esModule = true;

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class Env extends NodeEnvironment {
  constructor(config, options) {
    super(config, options);
    this.global.property = 'value';
    this.global.var1 = config.globalConfig.watch;
    this.global.var2 = config.projectConfig.cache;
  }
}

exports.default = Env;
