/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempt = 0;
let failureTime = 0;

jest.retryTimes(1, {
  entireDescribe: true,
  logErrorsBeforeRetry: true,
  waitBeforeRetry: 100,
});

beforeAll(() => {
  attempt += 1;
});

test('waits and logs errors before retrying', () => {
  if (attempt === 1) {
    failureTime = Date.now();
  }
  if (attempt === 2) {
    expect(Date.now() - failureTime).toBeGreaterThanOrEqual(100);
  }
  expect(attempt).toBe(2);
});
