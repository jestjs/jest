/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const skipOnWindows = require('../../scripts/skip_on_windows');
const {run, extractSummary} = require('../utils');
const runJest = require('../runJest');

skipOnWindows.suite();
const dir = path.resolve(__dirname, '..', 'native-async-mock');

test('mocks async functions', () => {
  if (process.versions.node < '7.6.0') {
    return;
  }
  if (process.platform !== 'win32') {
    run('yarn', dir);
  }
  // --no-cache because babel can cache stuff and result in false green
  const {stderr} = runJest(dir, ['--no-cache']);
  expect(extractSummary(stderr).summary).toMatch(
    'Test Suites: 1 passed, 1 total',
  );
});
