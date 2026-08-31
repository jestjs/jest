/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempts = 0;

describe('afterAll-owned unhandled rejection', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempts += 1;
  });

  test('passes before cleanup fails', () => {});

  afterAll(() => {
    Promise.reject(new Error('afterAll unhandled rejection'));
  });
});

test('does not retry after failed cleanup', () => {
  expect(attempts).toBe(1);
});
