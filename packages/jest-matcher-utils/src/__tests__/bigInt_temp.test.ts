/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {diff, ensureNumbers, MatcherHintOptions, stringify} from '../';

describe('BigInt', () => {
  test('TEMP HAPPY JEST', () => {
    expect(1).toBe(1);
  });

  /* global BigInt */
  if (typeof BigInt === 'function') {
    describe('.stringify()', () => {
      [[BigInt(1), '1n'], [BigInt(0), '0n']].forEach(([v, s]) => {
        test(stringify(v), () => {
          expect(stringify(v)).toBe(s);
        });
      });
    });

    describe('.ensureNumbers()', () => {
      test('dont throw error when variables are numbers', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers(1, 2);
        }).not.toThrow();
      });

      test('dont throw error when variables are bigint', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers(BigInt(1), BigInt(2));
        }).not.toThrow();
      });

      test('throws error when expected is not a number (backward compatibility)', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers(1, 'not_a_number', '.toBeCloseTo');
        }).toThrow();
      });

      test('throws error when expected is not a BigInt (backward compatibility)', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers(BigInt(1), 'not_a_number', '.toBeCloseTo');
        }).toThrow();
      });

      test('throws error when received is not a BigInt (backward compatibility)', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers('not_a_number', BigInt(3), '.toBeCloseTo');
        }).toThrow();
      });

      test('throws error when received is not a number (backward compatibility)', () => {
        expect(() => {
          // @ts-ignore
          ensureNumbers('not_a_number', 3, '.toBeCloseTo');
        }).toThrow();
      });

      describe('with options', () => {
        const matcherName = 'toBeCloseTo';

        test('promise empty isNot false received', () => {
          const options: MatcherHintOptions = {
            isNot: false,
            promise: '',
            secondArgument: 'precision',
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers('', 0, matcherName, options);
          }).toThrow();
        });

        test('promise empty isNot true expected', () => {
          const options: MatcherHintOptions = {
            isNot: true,
            // promise undefined is equivalent to empty string
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers(0.1, undefined, matcherName, options);
          }).toThrow();
        });

        test('promise rejects isNot false expected', () => {
          const options: MatcherHintOptions = {
            isNot: false,
            promise: 'rejects',
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers(0.01, '0', matcherName, options);
          }).toThrow();
        });

        test('promise rejects isNot true received', () => {
          const options: MatcherHintOptions = {
            isNot: true,
            promise: 'rejects',
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers(Symbol('0.1'), 0, matcherName, options);
          }).toThrow();
        });

        test('promise resolves isNot false received', () => {
          const options: MatcherHintOptions = {
            isNot: false,
            promise: 'resolves',
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers(false, 0, matcherName, options);
          }).toThrow();
        });

        test('promise resolves isNot true expected', () => {
          const options: MatcherHintOptions = {
            isNot: true,
            promise: 'resolves',
          };
          expect(() => {
            // @ts-ignore
            ensureNumbers(0.1, null, matcherName, options);
          }).toThrow();
        });
      });
    });

    describe('diff', () => {
      test('two bigint', () => {
        expect(diff(BigInt(1), BigInt(2))).toBe(null);
      });
    });
  }
});
