/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {linkJestPackage, run} = require('../utils');
const {extractSummary} = require('../utils');
const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

skipOnWindows.suite();
const dir = path.resolve(__dirname, '..', 'native-async-mock');

test('mocks async functions', () => {
  if (process.versions.node < '7.6.0') {
    return;
  }
  if (process.platform !== 'win32') {
    run('yarn', dir);
    linkJestPackage('babel-jest', dir);
  }
  // --no-cache because babel can cache stuff and result in false green
  const {stderr} = runJest(dir, ['--no-cache']);
  expect(extractSummary(stderr).summary).toMatch(
    'Test Suites: 1 passed, 1 total',
  );
});
