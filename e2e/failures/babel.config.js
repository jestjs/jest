/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const baseConfig = require('../../babel.config');

module.exports = Object.assign({}, baseConfig, {
  presets: baseConfig.presets.concat('@babel/preset-flow'),
});
