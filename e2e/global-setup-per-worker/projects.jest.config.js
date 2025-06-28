/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

module.exports = {
  globalSetupPerWorker: '<rootDir>/setup.js',
  projects: [
    {
      displayName: 'project-1',
      globalSetupPerWorker: '<rootDir>/setup.js',
      rootDir: path.resolve(__dirname, './project-1'),
      testMatch: ['<rootDir>/**/*.test.js'],
      transform: {
        '\\.[jt]sx?$': [require.resolve('babel-jest'), {root: __dirname}],
      },
      transformIgnorePatterns: ['/node_modules/', '/packages/'],
    },
    {
      displayName: 'project-2',
      globalSetupPerWorker: '<rootDir>/setup.js',
      rootDir: path.resolve(__dirname, './project-2'),
      testMatch: ['<rootDir>/**/*.test.js'],
      transform: {
        '\\.[jt]sx?$': [require.resolve('babel-jest'), {root: __dirname}],
      },
      transformIgnorePatterns: ['/node_modules/', '/packages/'],
    },
  ],
};
