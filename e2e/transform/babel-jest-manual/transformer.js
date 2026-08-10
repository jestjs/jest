/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {createTransformer} = require('babel-jest');

module.exports = createTransformer({
  presets: ['@babel/preset-flow'],
  root: __dirname,
});
