/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

test('run timers after resetAllMocks test', () => {
  const result = runJest('timer-resetMocks/after_resetAllMocks');
  expect(result.status).toBe(0);
});

test('run timers with resetMocks in config test', () => {
  const result = runJest('timer-resetMocks/with_resetMocks');
  expect(result.status).toBe(0);
});
