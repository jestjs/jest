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

  it.concurrent.only.failing('failing passes = fails', () => {
    expect(10).toBe(10);
  });

  test.concurrent.only.failing.each([
    {a: 1, b: 1, expected: 2},
    {a: 1, b: 2, expected: 3},
    {a: 2, b: 1, expected: 3},
  ])('.add($a, $b)', ({a, b, expected}) => {
    expect(a + b).toBe(expected);
  });

  it.concurrent.only.failing('failing fails = passes', () => {
    expect(10).toBe(101);
  });

  it.concurrent.failing('skipped failing fails', () => {
    expect(10).toBe(101);
  });
});
