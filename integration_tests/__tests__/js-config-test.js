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

const dir = path.resolve(__dirname, '../js-config');

skipOnWindows.suite();

test('throwing not Error objects', () => {
  const {stderr} = runJest(dir, ['--config', './jestrc.js']);
  expect(extractSummary(stderr)).toMatchSnapshot();
});
