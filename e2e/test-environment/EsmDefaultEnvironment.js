/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

exports.__esModule = true;

const NodeEnvironment = require('jest-environment-node');

class Env extends NodeEnvironment {
  constructor(config, options) {
    super(config, options);
    this.global.property = 'value';
  }
}

exports.default = Env;
