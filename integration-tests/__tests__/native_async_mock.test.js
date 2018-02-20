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
const {run, extractSummary} = require('../Utils');
const runJest = require('../runJest');

const dir = path.resolve(__dirname, '..', 'native-async-mock');

test('mocks async functions', () => {
  if (process.versions.node < '7.6.0') {
    return;
  }

  run('yarn', dir);

  // --no-cache because babel can cache stuff and result in false green
  const {stderr} = runJest(dir, ['--no-cache']);
  expect(extractSummary(stderr).summary).toMatch(
    'Test Suites: 1 passed, 1 total',
  );
});
