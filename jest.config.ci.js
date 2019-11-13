/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Object spread is just node 8
module.exports = Object.assign({}, require('./jest.config'), {
  coverageReporters: ['json'],
  reporters: [
    ['jest-junit', {outputDirectory: 'reports/junit', outputName: 'js-test-results.xml'}],
    ['jest-silent-reporter', {useDots: true}],
  ],
});
