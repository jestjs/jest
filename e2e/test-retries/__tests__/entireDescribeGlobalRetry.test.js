/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let flakyInvocations = 0;
let passingInvocations = 0;
let suiteAttempts = 0;

describe('suite retry', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    suiteAttempts += 1;
  });

  test('runs passing tests again', () => {
    passingInvocations += 1;
  });

  test('uses the suite retry instead of the global test retry', () => {
    flakyInvocations += 1;
    expect(flakyInvocations).toBe(2);
  });

  afterAll(() => {
    if (flakyInvocations === 2) {
      expect(suiteAttempts).toBe(2);
      expect(passingInvocations).toBe(2);
    }
  });
});
