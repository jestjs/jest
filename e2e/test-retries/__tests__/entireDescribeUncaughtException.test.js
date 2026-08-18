/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('test-owned uncaught exception', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  test('retries the describe', async () => {
    if (attempt === 1) {
      setTimeout(() => {
        throw new Error('transient uncaught exception');
      }, 10);
      await new Promise(resolve => setTimeout(resolve, 60));
      return;
    }

    expect(attempt).toBe(2);
  });
});

describe('exception owned by a completed attempt', () => {
  let attempt = 0;

  jest.retryTimes(2, {entireDescribe: true, waitBeforeRetry: 10});

  beforeAll(() => {
    attempt += 1;
  });

  test('remains retryable when it arrives during the next attempt', async () => {
    if (attempt === 1) {
      setTimeout(() => {
        throw new Error('late owned exception');
      }, 50);
      throw new Error('first attempt failure');
    }

    if (attempt === 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    expect(attempt).toBe(3);
  });
});
