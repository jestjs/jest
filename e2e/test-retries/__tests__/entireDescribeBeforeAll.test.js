/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const events = [];
let attempt = 0;

jest.retryTimes(1, {entireDescribe: true});

beforeAll(() => {
  attempt += 1;
  events.push(`beforeAll ${attempt}`);
  if (attempt === 1) {
    throw new Error('Failure in beforeAll');
  }
});

test('runs after beforeAll recovers', () => {
  events.push(`test ${attempt}`);
  expect(attempt).toBe(2);
});

afterAll(() => {
  events.push(`afterAll ${attempt}`);
  if (attempt === 2) {
    expect(events).toEqual([
      'beforeAll 1',
      'afterAll 1',
      'beforeAll 2',
      'test 2',
      'afterAll 2',
    ]);
  }
});
