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

test('moduleNameMapper wrong configuration', () => {
  const result = runJest('moduleNameMapper-wrong-config');
  expect(result.status).toBe(1);
});

test('moduleNameMapper correct configuration', () => {
  const result = runJest('moduleNameMapper-correct-config');
  expect(result.status).toBe(0);
});
