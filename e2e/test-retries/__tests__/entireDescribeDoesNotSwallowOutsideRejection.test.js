/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let innerAttempts = 0;

test('schedules a rejection outside the retried describe', () => {
  setTimeout(() => {
    Promise.reject(new Error('outside delayed rejection'));
  }, 10);
});

describe('retried describe', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    innerAttempts += 1;
  });

  test('waits while the outside rejection is raised', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(innerAttempts).toBe(1);
  });
});

test('does not retry for the outside rejection', () => {
  expect(innerAttempts).toBe(1);
});
