/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempt = 0;
const invocations = [0, 0];
let sequentialInvocations = 0;

jest.retryTimes(1, {entireDescribe: true});

beforeAll(() => {
  attempt += 1;
});

test.concurrent('runs passing tests again', () => {
  invocations[0] += 1;
});

test.concurrent('retries after a failure', () => {
  invocations[1] += 1;
  expect(attempt).toBe(2);
});

test('finishes each attempt before retrying', () => {
  sequentialInvocations += 1;
});

afterAll(() => {
  if (attempt === 2) {
    expect(invocations).toEqual([2, 2]);
    expect(sequentialInvocations).toBe(2);
  }
});
