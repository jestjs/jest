/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import each from '../';

describe('array', () => {
  describe('.add', () => {
    each([[0, 0, 0], [0, 1, 1], [1, 1, 2]]).test(
      'returns the result of adding %s to %s',
      (a, b, expected) => {
        expect(a + b).toBe(expected);
      },
    );
  });
});

describe('template', () => {
  describe('.add', () => {
    each`
      a    | b    | expected
      ${0} | ${0} | ${0}
      ${0} | ${1} | ${1}
      ${1} | ${1} | ${2}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
      expect(a + b).toBe(expected);
    });
  });

  describe('comments', () => {
    describe('removes commented out tests', () => {
      let testCount = 0;
      const expectedTestCount = 2;

      each`
      a    | b    | expected
      // ${1} | ${1} | ${0}
      ${1} | ${1} | ${2}
      /* ${1} | ${1} | ${5} */
      ${1} | ${1} | ${2}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
        testCount += 1;
        expect(a + b).toBe(expected);
      });

      test('test runs', () => {
        expect(testCount).toEqual(expectedTestCount);
      });
    });

    describe('removes trailing comments', () => {
      let testCount = 0;
      const expectedTestCount = 3;

      each`
      a    | b    | expected
      ${0} | ${0} | ${0} // ignores trailing comment
      ${1} | ${1} | ${2} /* ignores second comment */
      /* ${1} | ${1} | ${3} /* ignores second comment */ */
      ${2} | ${2} | ${4}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
        testCount += 1;
        expect(a + b).toBe(expected);
      });

      test('test runs', () => {
        expect(testCount).toEqual(expectedTestCount);
      });
    });

    describe('removes trailing comments in title', () => {
      let testCount = 0;
      const expectedTestCount = 1;

      each`
      a    | b    | expected // should be removed
      ${0} | ${0} | ${0}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
        testCount += 1;
        expect(a + b).toBe(expected);
      });

      test('test runs', () => {
        expect(testCount).toEqual(expectedTestCount);
      });
    });

    describe('removes /**/ comments title', () => {
      let testCount = 0;
      const expectedTestCount = 1;
      each`
      a    | b   /* inside */ | expected /* should be removed */
      ${0} | ${0} | ${0}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
        testCount += 1;
        expect(a + b).toBe(expected);
      });

      test('test runs', () => {
        expect(testCount).toEqual(expectedTestCount);
      });
    });

    describe('support comments above headings', () => {
      let testCount = 0;
      const expectedTestCount = 1;

      each`
      // title should still work
      /* more comments */
      a    | b    | expected
      ${0} | ${0} | ${0}
    `.test('returns $expected when given $a and $b', ({a, b, expected}) => {
        testCount += 1;
        expect(a + b).toBe(expected);
      });

      test('test runs', () => {
        expect(testCount).toEqual(expectedTestCount);
      });
    });
  });
});
