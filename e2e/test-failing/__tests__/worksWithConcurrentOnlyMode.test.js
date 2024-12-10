/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('block with concurrent', () => {
  it('skipped failing test', () => {
    expect(10).toBe(101);
  });

  it.concurrent.only.failing('.only.failing() should fail', () => {
    expect(10).toBe(10);
  });

  it.concurrent.only.failing('.only.failing() should pass', () => {
    expect(10).toBe(101);
  });

  test.concurrent.only.failing.each([
    {a: 1, b: 1, expected: 2},
    {a: 1, b: 2, expected: 3},
    {a: 2, b: 1, expected: 3},
  ])('.add($a, $b) .only.failing.each() should fail', ({a, b, expected}) => {
    expect(a + b).toBe(expected);
  });

  test.concurrent.only.failing.each([
    {a: 1, b: 1, expected: 2},
    {a: 1, b: 2, expected: 3},
    {a: 2, b: 1, expected: 3},
  ])('.add($a, $b) .only.failing.each() should pass', ({a, b, expected}) => {
    expect(a + b).toBe(expected + 10);
  });

  test.concurrent.failing.each([
    {a: 1, b: 1, expected: 2},
    {a: 1, b: 2, expected: 3},
    {a: 2, b: 1, expected: 3},
  ])('.add($a, $b) skipped each', ({a, b, expected}) => {
    expect(a + b).toBe(expected + 10);
  });

  it.concurrent.failing('skipped failing fails', () => {
    expect(10).toBe(101);
  });
});
