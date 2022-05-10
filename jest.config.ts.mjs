/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jestConfigBase from './jest.config.mjs';

export default {
  projects: [
    {
      displayName: {
        color: 'blue',
        name: 'ts-integration',
      },
      modulePathIgnorePatterns: jestConfigBase.modulePathIgnorePatterns,
      roots: ['<rootDir>/e2e/__tests__'],
      testMatch: ['<rootDir>/e2e/__tests__/ts*'],
    },
    {
      displayName: {
        color: 'blue',
        name: 'type-tests',
      },
      modulePathIgnorePatterns: jestConfigBase.modulePathIgnorePatterns,
      roots: ['<rootDir>/packages'],
      runner: 'jest-runner-tsd',
      testMatch: ['**/__typetests__/**/*.ts'],
    },
  ],
  reporters: ['default', 'github-actions'],
};
