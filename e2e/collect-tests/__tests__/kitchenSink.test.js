/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Exercises every shape that affects test counts: plain tests, `.each`
// expansion (array + template), nested describes, `.skip`, `describe.skip`,
// `.todo` and `.failing` (xfail). The companion e2e test asserts that
// `--collect-tests` reports the same per-status counts as a real run.

const rows = Array.from({length: 30}, (_, index) => index);

describe('plain and each', () => {
  for (const index of rows) {
    test(`passes ${index}`, () => {
      expect(index).toBe(index);
    });
  }

  test.each(rows)('array case %i', value => {
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it.each`
    left | right
    ${1} | ${1}
    ${2} | ${2}
  `('template case $left == $right', ({left, right}) => {
    expect(left).toBe(right);
  });

  describe.each([1, 2])('describe.each %i', value => {
    test('deeply nested passes', () => {
      expect(value).toBe(value);
    });
  });
});

describe('skips', () => {
  test.skip('explicitly skipped', () => {
    throw new Error('should never run');
  });

  it.skip.each([1, 2])('skipped each %i', () => {
    throw new Error('should never run');
  });
});

describe.skip('entirely skipped describe', () => {
  test('child one', () => {
    throw new Error('should never run');
  });
  describe('nested under skip', () => {
    test('grandchild', () => {
      throw new Error('should never run');
    });
  });
});

describe('todos', () => {
  test.todo('write this later');
  test.todo('and this one');
});

test.failing('known broken passes when it throws', () => {
  expect(1).toBe(2);
});
