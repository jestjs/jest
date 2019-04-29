/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* global BigInt */

const {stringify} = require('jest-matcher-utils');

const chalk = require('chalk');
const jestExpect = require('../');

const chalkEnabled = chalk.enabled;

beforeAll(() => {
  chalk.enabled = true;
});

afterAll(() => {
  chalk.enabled = chalkEnabled;
});

describe('BigInt', () => {
  test('TEMP HAPPY JEST', () => {
    expect(1).toBe(1);
  });

  /* global BigInt */
  if (typeof BigInt === 'function') {
    const MAX_SAFE_AS_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
    describe('.toBeCloseTo()', () => {
      [
        [BigInt(0), BigInt(0)],
        [MAX_SAFE_AS_BIGINT, MAX_SAFE_AS_BIGINT + BigInt(49)],
      ].forEach(([n1, n2]) => {
        it(`{pass: true} expect(${n1})toBeCloseTo( ${n2})`, () => {
          jestExpect(n1).toBeCloseTo(n2);

          expect(() => jestExpect(n1).not.toBeCloseTo(n2)).toThrow();
        });
      });

      test('Throws for default precision', () => {
        expect(() =>
          jestExpect(MAX_SAFE_AS_BIGINT).toBeCloseTo(
            MAX_SAFE_AS_BIGINT + BigInt(50),
          ),
        ).toThrow();
      });

      test('accepts an optional precision argument', () => {
        jestExpect(MAX_SAFE_AS_BIGINT).toBeCloseTo(
          MAX_SAFE_AS_BIGINT + BigInt(4),
          -1,
        );
      });

      test('Allows mix of Bigints or numbers', () => {
        jestExpect(BigInt(0)).toBeCloseTo(49);
      });

      test('throws when non-negative precision arguments passed with BigInts', () => {
        expect(() =>
          jestExpect(MAX_SAFE_AS_BIGINT).toBeCloseTo(MAX_SAFE_AS_BIGINT, 1),
        ).toThrow();
      });
    });

    describe('.toBe()', () => {
      it('does not throw', () => {
        jestExpect(BigInt(1)).not.toBe(BigInt(2));
        jestExpect(BigInt(1)).toBe(BigInt(1));
      });

      [[BigInt(1), BigInt(2)]].forEach(([a, b]) => {
        it(`fails for: ${stringify(a)} and ${stringify(b)}`, () => {
          expect(() => jestExpect(a).toBe(b)).toThrow();
        });
      });

      [BigInt(1)].forEach(v => {
        it(`fails for '${stringify(v)}' with '.not'`, () => {
          expect(() => jestExpect(v).not.toBe(v)).toThrow();
        });
      });
    });
    describe('.toEqual()', () => {
      [[BigInt(1), BigInt(2)]].forEach(([a, b]) => {
        test(`{pass: false} expect(${stringify(a)}).toEqual(${stringify(
          b,
        )})`, () => {
          expect(() => jestExpect(a).toEqual(b)).toThrow();
          jestExpect(a).not.toEqual(b);
        });
      });

      [[BigInt(1), BigInt(1)]].forEach(([a, b]) => {
        test(`{pass: true} expect(${stringify(a)}).not.toEqual(${stringify(
          b,
        )})`, () => {
          jestExpect(a).toEqual(b);
          expect(() => jestExpect(a).not.toEqual(b)).toThrow();
        });
      });
    });

    describe('.toBeTruthy(), .toBeFalsy()', () => {
      [BigInt(1)].forEach(v => {
        test(`'${stringify(v)}' is truthy`, () => {
          jestExpect(v).toBeTruthy();
          jestExpect(v).not.toBeFalsy();

          expect(() => jestExpect(v).not.toBeTruthy()).toThrow();

          expect(() => jestExpect(v).toBeFalsy()).toThrow();
        });
      });

      [BigInt(0)].forEach(v => {
        test(`'${stringify(v)}' is falsy`, () => {
          jestExpect(v).toBeFalsy();
          jestExpect(v).not.toBeTruthy();

          expect(() => jestExpect(v).toBeTruthy()).toThrow();

          expect(() => jestExpect(v).not.toBeFalsy()).toThrow();
        });
      });
    });

    describe('.toBeDefined(), .toBeUndefined()', () => {
      [BigInt(1)].forEach(v => {
        test(`'${stringify(v)}' is defined`, () => {
          jestExpect(v).toBeDefined();
          jestExpect(v).not.toBeUndefined();

          expect(() => jestExpect(v).not.toBeDefined()).toThrow();

          expect(() => jestExpect(v).toBeUndefined()).toThrow();
        });
      });
    });

    describe(
      '.toBeGreaterThan(), .toBeLessThan(), ' +
        '.toBeGreaterThanOrEqual(), .toBeLessThanOrEqual()',
      () => {
        [[BigInt(1), BigInt(2)]].forEach(([small, big]) => {
          it(`{pass: true} expect(${small}).toBeLessThan(${big})`, () => {
            jestExpect(small).toBeLessThan(big);
          });

          it(`{pass: false} expect(${big}).toBeLessThan(${small})`, () => {
            jestExpect(big).not.toBeLessThan(small);
          });

          it(`{pass: true} expect(${big}).toBeGreaterThan(${small})`, () => {
            jestExpect(big).toBeGreaterThan(small);
          });

          it(`{pass: false} expect(${small}).toBeGreaterThan(${big})`, () => {
            jestExpect(small).not.toBeGreaterThan(big);
          });

          it(`{pass: true} expect(${small}).toBeLessThanOrEqual(${big})`, () => {
            jestExpect(small).toBeLessThanOrEqual(big);
          });

          it(`{pass: false} expect(${big}).toBeLessThanOrEqual(${small})`, () => {
            jestExpect(big).not.toBeLessThanOrEqual(small);
          });

          it(`{pass: true} expect(${big}).toBeGreaterThanOrEqual(${small})`, () => {
            jestExpect(big).toBeGreaterThanOrEqual(small);
          });

          it(`{pass: false} expect(${small}).toBeGreaterThanOrEqual(${big})`, () => {
            jestExpect(small).not.toBeGreaterThanOrEqual(big);
          });

          it(`throws: [${small}, ${big}]`, () => {
            expect(() => jestExpect(small).toBeGreaterThan(big)).toThrow();

            expect(() => jestExpect(small).not.toBeLessThan(big)).toThrow();

            expect(() => jestExpect(big).not.toBeGreaterThan(small)).toThrow();

            expect(() => jestExpect(big).toBeLessThan(small)).toThrow();

            expect(() =>
              jestExpect(small).toBeGreaterThanOrEqual(big),
            ).toThrow();

            expect(() =>
              jestExpect(small).not.toBeLessThanOrEqual(big),
            ).toThrow();

            expect(() =>
              jestExpect(big).not.toBeGreaterThanOrEqual(small),
            ).toThrow();

            expect(() => jestExpect(big).toBeLessThanOrEqual(small)).toThrow();
          });
        });

        [[BigInt(1), BigInt(1)]].forEach(([n1, n2]) => {
          test(`equal numbers: [${n1}, ${n2}]`, () => {
            jestExpect(n1).toBeGreaterThanOrEqual(n2);
            jestExpect(n1).toBeLessThanOrEqual(n2);

            expect(() =>
              jestExpect(n1).not.toBeGreaterThanOrEqual(n2),
            ).toThrow();

            expect(() => jestExpect(n1).not.toBeLessThanOrEqual(n2)).toThrow();
          });
        });
      },
    );

    describe('.toStrictEqual()', () => {
      class TestClassA {
        constructor(a, b) {
          this.a = a;
          this.b = b;
        }
      }

      it('passes when comparing same type', () => {
        expect({
          test: new TestClassA(BigInt(1), BigInt(2)),
        }).toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))});
      });

      it('matches the expected snapshot when it fails', () => {
        expect(() =>
          jestExpect({
            test: BigInt(2),
          }).toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))}),
        ).toThrow();

        expect(() =>
          jestExpect({
            test: new TestClassA(BigInt(1), BigInt(2)),
          }).not.toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))}),
        ).toThrow();
      });

      /* eslint-disable no-sparse-arrays */
      it('passes for matching sparse arrays', () => {
        expect([, BigInt(1)]).toStrictEqual([, BigInt(1)]);
      });

      it('does not pass when sparseness of arrays do not match', () => {
        expect([, BigInt(1)]).not.toStrictEqual([undefined, BigInt(1)]);
        expect([undefined, BigInt(1)]).not.toStrictEqual([, BigInt(1)]);
        expect([, , , BigInt(1)]).not.toStrictEqual([, BigInt(1)]);
      });

      it('does not pass when equally sparse arrays have different values', () => {
        expect([, BigInt(1)]).not.toStrictEqual([, BigInt(2)]);
      });
      /* eslint-enable */
    });

    describe('Reproduce From #6829', () => {
      test('It should accept BigInt("x") way', () => {
        const a = BigInt('123456789012345678901234567890');
        jestExpect(typeof a).toEqual('bigint');
      });
      test('It should allow to do equal comparision', () => {
        const a = BigInt(2);
        jestExpect(a).toEqual(BigInt(2));
      });
      test('It should allow to do greater than comparision', () => {
        const a = BigInt(2);
        jestExpect(a).toBeGreaterThan(1);
      });
      test('It should allow to do greater than or equal comparision', () => {
        const a = BigInt(2);
        jestExpect(a).toBeGreaterThanOrEqual(2);
      });
      test('It should allow to do less than comparision', () => {
        const a = BigInt(2);
        jestExpect(a).toBeLessThan(3);
      });
      test('It should allow to do less than or equal comparision', () => {
        const a = BigInt(2);
        jestExpect(a).toBeLessThanOrEqual(2);
      });
    });
  }
});
