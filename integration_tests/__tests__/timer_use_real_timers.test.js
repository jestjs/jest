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

const runJest = require('../runJest');

test('useRealTimers cancels "timers": "fake" for whole test file', () => {
  const result = runJest('timer_use_real_timers');
  expect(result.stdout).toMatch('API is not mocked with fake timers.');
  expect(result.status).toBe(0);
});
