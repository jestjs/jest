/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('zero describe retries', () => {
  let invocations = 0;

  jest.retryTimes(0, {entireDescribe: true});

  test('disables inherited per-test retries', () => {
    invocations += 1;
    throw new Error('fails without retrying');
  });

  afterAll(() => {
    expect(invocations).toBe(1);
  });
});
