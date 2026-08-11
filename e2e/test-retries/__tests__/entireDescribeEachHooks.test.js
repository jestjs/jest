/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('beforeEach failure', () => {
  let attempt = 0;
  let hookInvocations = 0;
  let testInvocations = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  beforeEach(() => {
    hookInvocations += 1;
    if (attempt === 1) {
      throw new Error('beforeEach failed');
    }
  });

  test('retries the describe', () => {
    testInvocations += 1;
    expect(attempt).toBe(2);
  });

  afterAll(() => {
    if (attempt === 2) {
      expect(hookInvocations).toBe(2);
      expect(testInvocations).toBe(1);
    }
  });
});

describe('afterEach failure', () => {
  let attempt = 0;
  let hookInvocations = 0;
  let testInvocations = 0;

  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
  });

  afterEach(() => {
    hookInvocations += 1;
    if (attempt === 1) {
      throw new Error('afterEach failed');
    }
  });

  test('retries the describe', () => {
    testInvocations += 1;
  });

  afterAll(() => {
    if (attempt === 2) {
      expect(hookInvocations).toBe(2);
      expect(testInvocations).toBe(2);
    }
  });
});
