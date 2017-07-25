/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const skipOnWindows = require('../../scripts/skip_on_windows');
const runJest = require('../runJest');

skipOnWindows.suite();

test('does not crash when expect involving a DOM node fails', () => {
  const result = runJest('compare-dom-nodes');

  expect(result.stderr).toContain('FAIL  __tests__/failed-assertion.js');
});
