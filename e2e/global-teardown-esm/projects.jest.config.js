/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

export default {
  globalTeardown: '<rootDir>/teardown.js',
  projects: [
    {
      displayName: 'project-1',
      globalTeardown: '<rootDir>/teardown.js',
      rootDir: path.resolve(__dirname, './project-1'),
      testMatch: ['<rootDir>/**/*.test.js'],
      transform: {},
    },
    {
      displayName: 'project-2',
      globalTeardown: '<rootDir>/teardown.js',
      rootDir: path.resolve(__dirname, './project-2'),
      testMatch: ['<rootDir>/**/*.test.js'],
      transform: {},
    },
  ],
};
