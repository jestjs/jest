/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import baseConfig from './jest.config.mjs';

/** @type {import('jest').Config} */
export default {
  ...baseConfig,
  coverageReporters: ['json'],
  reporters: [
    'github-actions',
    [
      'jest-junit',
      {outputDirectory: 'reports/junit', outputName: 'js-test-results.xml'},
    ],
    'default',
    'summary',
  ],
};
