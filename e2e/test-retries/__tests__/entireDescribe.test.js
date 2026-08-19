/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const events = [];
let attempt = 0;
let skippedInvocations = 0;

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

test('finishes the attempt before retrying', () => {
  events.push(`third ${attempt}`);
});

describe('nested describe without its own retry setting', () => {
  beforeAll(() => {
    events.push(`nested beforeAll ${attempt}`);
  });

  test('is rerun by the outer describe', () => {
    events.push(`nested test ${attempt}`);
  });

  afterAll(() => {
    events.push(`nested afterAll ${attempt}`);
  });
});

test.skip('does not run skipped tests', () => {
  skippedInvocations += 1;
});

test.todo('does not run todo tests');

afterAll(() => {
  events.push(`afterAll ${attempt}`);
  if (attempt === 2) {
    expect(skippedInvocations).toBe(0);
    expect(events).toEqual([
      'beforeAll 1',
      'first 1',
      'second 1',
      'third 1',
      'nested beforeAll 1',
      'nested test 1',
      'nested afterAll 1',
      'afterAll 1',
      'beforeAll 2',
      'first 2',
      'second 2',
      'third 2',
      'nested beforeAll 2',
      'nested test 2',
      'nested afterAll 2',
      'afterAll 2',
    ]);
  }
});
