/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['./**/index.js', '!./__tests__/**/*.js'],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: 'Package 1',
      rootDir: '<rootDir>/packages/package-1',
      testMatch: ['<rootDir>/__tests__/**/*.e2e.js'],
    },
    {
      displayName: 'Package 2',
      rootDir: '<rootDir>/packages/package-2',
      testMatch: ['<rootDir>/__tests__/**/*.e2e.js'],
    },
    {
      collectCoverage: false,
      displayName: 'Package 3',
      rootDir: '<rootDir>/packages/package-3',
      testMatch: ['<rootDir>/__tests__/**/*.e2e.js'],
    },
  ],
};
