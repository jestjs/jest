/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const rootDirs = ['<rootDir>/packages/expect', '<rootDir>/packages/jest-types'];

const projects = rootDirs.map(rootDir => ({
  displayName: {
    color: 'blue',
    name: 'types',
  },
  rootDir,
  runner: 'jest-runner-tsd',
  testMatch: ['**/__typechecks__/**/*.test.ts'],
}));

module.exports = {
  projects,
};
