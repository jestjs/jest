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

test('suite with auto-reset', () => {
  const result = runJest('auto-reset-mocks/with-auto-reset');
  expect(result.status).toBe(0);
});

test('suite without auto-reset', () => {
  const result = runJest('auto-reset-mocks/without-auto-reset');
  expect(result.status).toBe(0);
});
