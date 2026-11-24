/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempts = 0;

setTimeout(() => {
  Promise.reject(new Error('global delayed rejection'));
}, 10);

describe('retried describe', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempts += 1;
  });

  test('waits while the global rejection is raised', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(attempts).toBe(1);
  });
});
