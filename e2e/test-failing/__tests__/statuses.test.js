/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it('passes', () => {
  expect(10).toBe(10);
});

it('fails', () => {
  expect(10).toBe(101);
});

it.skip('skips', () => {
  expect(10).toBe(101);
});

it.todo('todo');

it.failing('failing fails = passes', () => {
  expect(10).toBe(101);
});

test.failing('failing fails = passes with test syntax', () => {
  expect(10).toBe(101);
});

test.failing.each([
  {a: 1, b: 1, expected: 2},
  {a: 1, b: 2, expected: 3},
  {a: 2, b: 1, expected: 3},
])('.add($a, $b)', ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});

it.skip.failing('skipped failing 1', () => {
  expect(10).toBe(10);
});

test.skip.failing('skipped failing 2', () => {
  expect(10).toBe(101);
});

it.failing('failing passes = fails', () => {
  expect(10).toBe(10);
});

xit.failing('skipped failing with different syntax', () => {
  expect(10).toBe(10);
});

xtest.failing('skipped failing with another different syntax', () => {
  expect(10).toBe(10);
});
