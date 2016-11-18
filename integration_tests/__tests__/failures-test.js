/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {extractSummary} = require('../utils');
const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

const dir = path.resolve(__dirname, '../failures');

skipOnWindows.suite();

test('throwing not Error objects', () => {
  let stderr;
  stderr = runJest(dir, ['throw-number-test.js']).stderr;
  expect(extractSummary(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['throw-string-test.js']).stderr;
  expect(extractSummary(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['throw-object-test.js']).stderr;
  expect(extractSummary(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['assertion-count-test.js']).stderr;
  expect(extractSummary(stderr)).toMatchSnapshot();
});
