/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {diff, ensureNumbersOrBigInt, MatcherHintOptions, stringify} from '../';

describe('.stringify()', () => {
  [[BigInt(1), '1n'], [BigInt(0), '0n']].forEach(([v, s]) => {
    test(stringify(v), () => {
      expect(stringify(v)).toBe(s);
    });
  });
});

describe('.ensureNumbersOrBigInt()', () => {
  test('dont throw error when variables are numbers', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt(1, 2);
    }).not.toThrow();
  });

  test('dont throw error when variables are bigint', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt(BigInt(1), BigInt(2));
    }).not.toThrow();
  });

  test('throws error when expected is not a number (backward compatibility)', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt(1, 'not_a_number', '.toBeCloseTo');
    }).toThrowErrorMatchingSnapshot();
  });

  test('throws error when expected is not a BigInt (backward compatibility)', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt(BigInt(1), 'not_a_number', '.toBeCloseTo');
    }).toThrowErrorMatchingSnapshot();
  });

  test('throws error when received is not a BigInt (backward compatibility)', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt('not_a_number', BigInt(3), '.toBeCloseTo');
    }).toThrowErrorMatchingSnapshot();
  });

  test('throws error when received is not a number (backward compatibility)', () => {
    expect(() => {
      // @ts-ignore
      ensureNumbersOrBigInt('not_a_number', 3, '.toBeCloseTo');
    }).toThrowErrorMatchingSnapshot();
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
        ensureNumbersOrBigInt('', 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise empty isNot true expected', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        // promise undefined is equivalent to empty string
      };
      expect(() => {
        // @ts-ignore
        ensureNumbersOrBigInt(0.1, undefined, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise rejects isNot false expected', () => {
      const options: MatcherHintOptions = {
        isNot: false,
        promise: 'rejects',
      };
      expect(() => {
        // @ts-ignore
        ensureNumbersOrBigInt(0.01, '0', matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise rejects isNot true received', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        promise: 'rejects',
      };
      expect(() => {
        // @ts-ignore
        ensureNumbersOrBigInt(Symbol('0.1'), 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise resolves isNot false received', () => {
      const options: MatcherHintOptions = {
        isNot: false,
        promise: 'resolves',
      };
      expect(() => {
        // @ts-ignore
        ensureNumbersOrBigInt(false, 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise resolves isNot true expected', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        promise: 'resolves',
      };
      expect(() => {
        // @ts-ignore
        ensureNumbersOrBigInt(0.1, null, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });
  });
});

jest.mock('jest-diff', () => () => 'diff output');
describe('diff', () => {
  test('forwards to jest-diff', () => {
    [
      ['a', 'b'],
      ['a', {}],
      ['a', null],
      ['a', undefined],
      ['a', 1],
      ['a', BigInt(1)],
      ['a', true],
      [1, true],
      [BigInt(1), true],
    ].forEach(([actual, expected]) =>
      expect(diff(actual, expected)).toBe('diff output'),
    );
  });

  test('two booleans', () => {
    expect(diff(false, true)).toBe(null);
  });

  test('two numbers', () => {
    expect(diff(1, 2)).toBe(null);
  });

  test('two bigint', () => {
    expect(diff(BigInt(1), BigInt(2))).toBe(null);
  });
});
