/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempt = 0;
const orders = [];

jest.retryTimes(1, {entireDescribe: true});

beforeAll(() => {
  attempt += 1;
  orders.push([]);
});

test('first', () => {
  orders[attempt - 1].push('first');
});

describe('nested', () => {
  test('nested first', () => {
    orders[attempt - 1].push('nested first');
  });

  test('nested second', () => {
    orders[attempt - 1].push('nested second');
  });
});

test('flaky', () => {
  orders[attempt - 1].push('flaky');
  expect(attempt).toBe(2);
});

test('last', () => {
  orders[attempt - 1].push('last');
});

afterAll(() => {
  if (attempt === 2) {
    expect(orders[1]).toEqual(orders[0]);
  }
});
