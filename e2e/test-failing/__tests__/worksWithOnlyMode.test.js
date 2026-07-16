/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

describe('block with only, should pass', () => {
  it.only.failing('failing fails = passes, should pass', () => {
    expect(10).toBe(101);
  });

  it.only.failing.each([
    {a: 1, b: 1, expected: 2},
    {a: 1, b: 2, expected: 3},
    {a: 2, b: 1, expected: 3},
  ])('.add($a, $b)', ({a, b, expected}) => {
    expect(a + b).toBe(expected);
  });

  it('failing test but skipped', () => {
    expect(10).toBe(101);
  });

  it('passing test but skipped', () => {
    expect(10).toBe(10);
  });
});

describe('block with only, should fail', () => {
  it.only.failing('failing passes = fails, should fail', () => {
    expect(10).toBe(10);
  });

  it('failing test but skipped', () => {
    expect(10).toBe(101);
  });

  it('passing test but skipped', () => {
    expect(10).toBe(10);
  });
});

describe('block with only in other it, should skip', () => {
  it.failing('failing passes = fails, should fail but skipped', () => {
    expect(10).toBe(10);
  });

  it.only('failing test', () => {
    expect(10).toBe(101);
  });

  it('passing test but skipped', () => {
    expect(10).toBe(10);
  });
});

describe('block with only with different syntax, should fail', () => {
  fit.failing('failing passes = fails, should fail 1', () => {
    expect(10).toBe(10);
  });

  test.only.failing('failing passes = fails, should fail 2', () => {
    expect(10).toBe(10);
  });

  it('failing test but skipped', () => {
    expect(10).toBe(101);
  });

  it('passing test but skipped', () => {
    expect(10).toBe(10);
  });
});
