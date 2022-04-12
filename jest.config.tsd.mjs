/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jestConfigBase from './jest.config.mjs';

export default {
  displayName: {
    color: 'blue',
    name: 'types',
  },
  modulePathIgnorePatterns: jestConfigBase.modulePathIgnorePatterns,
  reporters: ['default', 'github-actions'],
  roots: ['<rootDir>/packages'],
  runner: 'jest-runner-tsd',
  testMatch: ['**/__typetests__/**/*.ts'],
};
