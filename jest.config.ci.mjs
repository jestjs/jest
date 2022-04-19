/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jestConfigBase from './jest.config.mjs';

export default {
  ...jestConfigBase,
  coverageReporters: ['json'],
  reporters: [
    'github-actions',
    [
      'jest-junit',
      {outputDirectory: 'reports/junit', outputName: 'js-test-results.xml'},
    ],
    [
      'jest-silent-reporter',
      {showPaths: true, showWarnings: true, useDots: true},
    ],
    'summary',
  ],
};
