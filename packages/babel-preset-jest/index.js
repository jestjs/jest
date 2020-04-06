/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const plugins = [
  require.resolve('babel-plugin-jest-hoist'),
  // TODO: replace all the below with a single preset in Jest 26: https://github.com/facebook/jest/pull/9774
  require.resolve('@babel/plugin-syntax-object-rest-spread'),
  require.resolve('@babel/plugin-syntax-bigint'),
  require.resolve('@babel/plugin-syntax-class-properties'),
  require.resolve('@babel/plugin-syntax-numeric-separator'),
];

// @babel/core requires us to export a function
module.exports = () => ({plugins});
