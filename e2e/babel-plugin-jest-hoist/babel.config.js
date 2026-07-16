/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  overrides: [
    {
      presets: ['@babel/preset-flow'],
      test: '**/*.js',
    },
    {
      presets: ['@babel/preset-typescript'],
      test: '**/*.ts',
    },
  ],
  plugins: ['jest-hoist'],
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
};
