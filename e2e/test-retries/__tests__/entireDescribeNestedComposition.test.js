/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let innerAttempts = 0;
let rootAttempts = 0;
let testInvocations = 0;

beforeAll(() => {
  rootAttempts += 1;
});

describe('local retry', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    innerAttempts += 1;
  });

  test('composes with the root retry', () => {
    testInvocations += 1;
    expect(testInvocations).toBe(4);
  });
});

afterAll(() => {
  if (rootAttempts === 2) {
    expect(innerAttempts).toBe(4);
    expect(testInvocations).toBe(4);
  }
});
