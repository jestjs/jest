/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// A deliberately large suite exercising every shape that affects test counts:
// plain tests, `.each` expansion, nested describes, `.skip`, `describe.skip`,
// `.todo` and `.failing` (xfail). The companion e2e test asserts that
// `--collect-tests` reports the exact same per-status counts as a real run.

const RUNNABLE_ROWS = Array.from({length: 50}, (_, index) => index);

describe('plain tests', () => {
  for (const index of RUNNABLE_ROWS) {
    test(`passes ${index}`, () => {
      expect(index).toBe(index);
    });
  }
});

describe('each expansion', () => {
  test.each(RUNNABLE_ROWS)('array case %i', value => {
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it.each`
    left | right
    ${1} | ${1}
    ${2} | ${2}
    ${3} | ${3}
  `('template case $left == $right', ({left, right}) => {
    expect(left).toBe(right);
  });

  describe.each([
    [1, 1],
    [2, 2],
  ])('describe.each %i', (left, right) => {
    test('inner a', () => {
      expect(left).toBe(right);
    });
    test('inner b', () => {
      expect(left).toBe(right);
    });
  });
});

describe('nesting', () => {
  describe('level two', () => {
    describe('level three', () => {
      test('deeply nested passes', () => {
        expect(true).toBe(true);
      });
    });
  });
});

describe('skips', () => {
  test.skip('explicitly skipped', () => {
    throw new Error('should never run');
  });

  it.skip.each([1, 2, 3])('skipped each %i', value => {
    throw new Error(`should never run ${value}`);
  });
});

describe.skip('entirely skipped describe', () => {
  test('child one', () => {
    throw new Error('should never run');
  });
  test('child two', () => {
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
  test.todo('plus a third');
});

describe('xfail', () => {
  test.failing('known broken passes when it throws', () => {
    expect(1).toBe(2);
  });
});
