/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('afterAll failure', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  test('passes', () => {});

  afterAll(() => {
    throw new Error(`afterAll attempt ${attempt}`);
  });
});

describe('test and afterAll failures', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  test('would pass on a retry', () => {
    if (attempt === 1) {
      throw new Error('transient test failure');
    }
  });

  afterAll(() => {
    throw new Error(`mixed afterAll attempt ${attempt}`);
  });
});

describe('persistent beforeAll failure', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    throw new Error('persistent beforeAll failure');
  });

  test('is reported as failed on the final attempt', () => {});
});

describe('persistent test failure', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  test('passes on every attempt', () => {
    expect(attempt).toBeGreaterThan(0);
  });

  test('fails on every attempt', () => {
    expect(true).toBe(false);
  });

  afterAll(() => {
    if (attempt > 1) {
      expect(attempt).toBe(2);
    }
  });
});

describe('process error after a todo test', () => {
  let attempt = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(async () => {
    attempt += 1;
    if (attempt === 2) {
      setTimeout(() => {
        throw new Error('process error after todo');
      }, 0);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });

  test('schedules a retry', () => {
    expect(attempt).toBe(2);
  });

  test.todo('leaves no stale running test');
});

describe('suppressed afterAll failure', () => {
  jest.retryTimes(1, {entireDescribe: true});

  test('passes', () => {});

  afterAll(() => {
    expect('suppressed afterAll actual').toMatchInlineSnapshot(
      '"suppressed afterAll expected"',
    );
  });
});
