/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const events = [];
let attempt = 0;

test('runs a preceding sibling once', () => {
  events.push('outer before');
});

describe('with retries', () => {
  jest.retryTimes(1, {entireDescribe: true});

  beforeAll(() => {
    attempt += 1;
    events.push(`beforeAll ${attempt}`);
  });

  test('runs passing tests again', () => {
    events.push(`first ${attempt}`);
  });

  test('retries after a failure', () => {
    events.push(`second ${attempt}`);
    expect(attempt).toBe(2);
  });

  afterAll(() => {
    events.push(`afterAll ${attempt}`);
  });
});

test('runs a following sibling once', () => {
  events.push('outer after');
  expect(events).toEqual([
    'outer before',
    'beforeAll 1',
    'first 1',
    'second 1',
    'afterAll 1',
    'beforeAll 2',
    'first 2',
    'second 2',
    'afterAll 2',
    'outer after',
  ]);
});
