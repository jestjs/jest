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

test('suite with auto-restore', () => {
  const result = runJest('auto-restore-mocks/with-auto-restore');
  expect(result.status).toBe(0);
});

test('suite without auto-restore', () => {
  const result = runJest('auto-restore-mocks/without-auto-restore');
  expect(result.status).toBe(0);
});
