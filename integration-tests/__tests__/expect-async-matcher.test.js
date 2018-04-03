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
const SkipOnWindows = require('../../scripts/SkipOnWindows');
const runJest = require('../runJest');
const {extractSummary} = require('../Utils');
const dir = path.resolve(__dirname, '../expect-async-matcher');

SkipOnWindows.suite();

test('works with passing tests', () => {
  const result = runJest(dir, ['success.test.js']);
  expect(result.status).toBe(0);
});

test('shows the correct errors in stderr when failing tests', () => {
  const result = runJest(dir, ['failure.test.js']);

  expect(result.status).toBe(1);
  expect(extractSummary(result.stderr)).toMatchSnapshot();
});
