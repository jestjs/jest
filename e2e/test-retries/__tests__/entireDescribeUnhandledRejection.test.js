/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('test-owned unhandled rejection', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  test('retries the describe', () => {
    if (attempt === 1) {
      Promise.reject(new Error('transient unhandled rejection'));
    } else {
      expect(attempt).toBe(2);
    }
  });
});

describe('beforeAll-owned unhandled rejection', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
    if (attempt === 1) {
      Promise.reject(new Error('transient beforeAll rejection'));
    }
  });

  test('retries the describe', () => {
    if (attempt === 2) {
      expect(attempt).toBe(2);
    }
  });
});

describe('beforeEach-owned unhandled rejection', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  beforeEach(() => {
    if (attempt === 1) {
      Promise.reject(new Error('transient beforeEach rejection'));
    }
  });

  test('retries the describe', () => {
    if (attempt === 2) {
      expect(attempt).toBe(2);
    }
  });
});

describe('rejection owned by a completed attempt', () => {
  let attempt = 0;

  jest.retryTimes(2, {entireDescribe: true, waitBeforeRetry: 10});

  beforeAll(() => {
    attempt += 1;
  });

  test('remains retryable when it arrives during the next attempt', async () => {
    if (attempt === 1) {
      setTimeout(() => {
        Promise.reject(new Error('late owned rejection'));
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
