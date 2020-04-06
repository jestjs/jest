/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const plugins = [require.resolve('babel-plugin-jest-hoist')];
const presets = [require.resolve('babel-preset-current-node-syntax')];

// @babel/core requires us to export a function
module.exports = () => ({plugins, presets});
