/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../utils');

// To pass on Windows
const normalizeSummaryPaths = string =>
  string.replace('__tests__\\index.js', '__tests__/index.js');

test('moduleNameMapper wrong configuration', () => {
  const {stderr, status} = runJest('module_name_mapper_wrong_config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(normalizeSummaryPaths(rest)).toMatchSnapshot();
});

test('moduleNameMapper correct configuration', () => {
  const {stderr, status} = runJest('module_name_mapper_correct_config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(normalizeSummaryPaths(rest)).toMatchSnapshot();
});
