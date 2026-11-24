/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempt = 0;

jest.retryTimes(1, {
  entireDescribe: true,
  logErrorsBeforeRetry: true,
});

beforeAll(() => {
  attempt += 1;
});

test('runs after the snapshot failure is restored', () => {
  expect(attempt).toMatchSnapshot();
  expect(attempt).toMatchInlineSnapshot('2');
  expect(attempt).toBe(2);
});
