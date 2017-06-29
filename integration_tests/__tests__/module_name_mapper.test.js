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
const slash = require('slash');

test('moduleNameMapper wrong configuration', () => {
  const {stderr, status} = runJest('module_name_mapper_wrong_config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(slash(rest)).toMatchSnapshot();
});

test('moduleNameMapper correct configuration', () => {
  const {stderr, status} = runJest('module_name_mapper_correct_config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(slash(rest)).toMatchSnapshot();
});
