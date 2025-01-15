/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as pico from 'picocolors';
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import {format as prettyFormat} from 'pretty-format';
import {
  type MatcherHintOptions,
  diff,
  ensureNoExpected,
  ensureNumbers,
  getLabelPrinter,
  matcherHint,
  pluralize,
  stringify,
} from '../';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

describe('stringify()', () => {
  for (const [v, s] of [
    [[], '[]'],
    [{}, '{}'],
    [1, '1'],
    [0, '0'],
    [1.5, '1.5'],
    [null, 'null'],
    [undefined, 'undefined'],
    ['abc', '"abc"'],
    [Symbol.for('abc'), 'Symbol(abc)'],
    /* eslint-disable unicorn/prefer-number-properties */
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    /* eslint-enable */
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'Infinity'],
    [Number.NEGATIVE_INFINITY, '-Infinity'],
    [/ab\.c/gi, '/ab\\.c/gi'],
    [BigInt(1), '1n'],
    [BigInt(0), '0n'],
  ]) {
    test(stringify(v), () => {
      expect(stringify(v)).toBe(s);
    });
  }

  test('circular references', () => {
    const a: any = {};
    a.a = a;
    expect(stringify(a)).toBe('{"a": [Circular]}');
  });

  test('toJSON error', () => {
    const evil = {
      toJSON() {
        throw new Error('Nope.');
      },
    };
    expect(stringify(evil)).toBe('{"toJSON": [Function toJSON]}');
    expect(stringify({a: {b: {evil}}})).toBe(
      '{"a": {"b": {"evil": {"toJSON": [Function toJSON]}}}}',
    );

    function Evil() {}
    Evil.toJSON = evil.toJSON;
    expect(stringify(Evil)).toBe('[Function Evil]');
  });

  test('toJSON errors when comparing two objects', () => {
    function toJSON() {
      throw new Error('Nope.');
    }
    const evilA = {
      a: 1,
      toJSON,
    };
    const evilB = {
      b: 1,
      toJSON,
    };

    expect(() => expect(evilA).toEqual(evilB)).toThrowErrorMatchingSnapshot();
  });

  test('reduces maxDepth if stringifying very large objects', () => {
    const big: any = {a: 1, b: {}};
    const small: any = {a: 1, b: {}};
    for (let i = 0; i < 10_000; i += 1) {
      big.b[i] = 'test';
    }

    for (let i = 0; i < 10; i += 1) {
      small.b[i] = 'test';
    }

    expect(stringify(big)).toBe(prettyFormat(big, {maxDepth: 1, min: true}));
    expect(stringify(small)).toBe(prettyFormat(small, {min: true}));
  });

  test('reduces maxWidth if stringifying very large arrays', () => {
    const big: any = [];
    const small: any = [];
    const testString = Array.from({length: 1000}).join('x');

    for (let i = 0; i < 100; i += 1) {
      big[i] = testString;
    }

    for (let i = 0; i < 3; i += 1) {
      small[i] = testString;
    }

    expect(stringify(big)).toBe(prettyFormat(big, {maxWidth: 5, min: true}));
    expect(stringify(small)).toBe(prettyFormat(small, {min: true}));
  });
});

describe('ensureNumbers()', () => {
  const matcherName = 'toBeCloseTo';

  test('dont throw error when variables are numbers', () => {
    expect(() => {
      ensureNumbers(1, 2, matcherName);
    }).not.toThrow();
    expect(() => {
      ensureNumbers(BigInt(1), BigInt(2), matcherName);
    }).not.toThrow();
  });

  test('throws error when expected is not a number (backward compatibility)', () => {
    expect(() => {
      ensureNumbers(1, 'not_a_number', `.${matcherName}`);
    }).toThrowErrorMatchingSnapshot();
  });

  test('throws error when received is not a number (backward compatibility)', () => {
    expect(() => {
      ensureNumbers('not_a_number', 3, `.${matcherName}`);
    }).toThrowErrorMatchingSnapshot();
  });

  describe('with options', () => {
    test('promise empty isNot false received', () => {
      const options: MatcherHintOptions = {
        isNot: false,
        promise: '',
        secondArgument: 'precision',
      };
      expect(() => {
        ensureNumbers('', 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise empty isNot true expected', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        // promise undefined is equivalent to empty string
      };
      expect(() => {
        ensureNumbers(0.1, undefined, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise rejects isNot false expected', () => {
      const options: MatcherHintOptions = {
        isNot: false,
        promise: 'rejects',
      };
      expect(() => {
        ensureNumbers(0.01, '0', matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise rejects isNot true received', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        promise: 'rejects',
      };
      expect(() => {
        ensureNumbers(Symbol('0.1'), 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise resolves isNot false received', () => {
      const options: MatcherHintOptions = {
        isNot: false,
        promise: 'resolves',
      };
      expect(() => {
        ensureNumbers(false, 0, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });

    test('promise resolves isNot true expected', () => {
      const options: MatcherHintOptions = {
        isNot: true,
        promise: 'resolves',
      };
      expect(() => {
        ensureNumbers(0.1, null, matcherName, options);
      }).toThrowErrorMatchingSnapshot();
    });
  });
});

describe('ensureNoExpected()', () => {
  const matcherName = 'toBeDefined';

  test('dont throw error when undefined', () => {
    expect(() => {
      ensureNoExpected(undefined, matcherName);
    }).not.toThrow();
  });

  test('throws error when expected is not undefined with matcherName', () => {
    expect(() => {
      ensureNoExpected({a: 1}, `.${matcherName}`);
    }).toThrowErrorMatchingSnapshot();
  });

  test('throws error when expected is not undefined with matcherName and options', () => {
    expect(() => {
      ensureNoExpected({a: 1}, matcherName, {isNot: true});
    }).toThrowErrorMatchingSnapshot();
  });
});

jest.mock('jest-diff', () => ({
  diff: () => 'diff output',
}));
describe('diff', () => {
  test('forwards to jest-diff', () => {
    for (const [actual, expected] of [
      ['a', 'b'],
      ['a', {}],
      ['a', null],
      ['a', undefined],
      ['a', 1],
      ['a', true],
      [1, true],
      [BigInt(1), true],
    ])
      expect(diff(actual, expected)).toBe('diff output');
  });

  test('two booleans', () => {
    expect(diff(false, true)).toBeNull();
  });

  test('two numbers', () => {
    expect(diff(1, 2)).toBeNull();
  });

  test('two bigints', () => {
    expect(diff(BigInt(1), BigInt(2))).toBeNull();
  });
});

describe('pluralize()', () => {
  test('one', () => expect(pluralize('apple', 1)).toBe('one apple'));
  test('two', () => expect(pluralize('apple', 2)).toBe('two apples'));
  test('20', () => expect(pluralize('apple', 20)).toBe('20 apples'));
});

describe('getLabelPrinter', () => {
  test('0 args', () => {
    const printLabel = getLabelPrinter();
    expect(printLabel('')).toBe(': ');
  });
  test('1 empty string', () => {
    const printLabel = getLabelPrinter();
    expect(printLabel('')).toBe(': ');
  });
  test('1 non-empty string', () => {
    const string = 'Expected';
    const printLabel = getLabelPrinter(string);
    expect(printLabel(string)).toBe('Expected: ');
  });
  test('2 equal lengths', () => {
    const stringExpected = 'Expected value';
    const collectionType = 'array';
    const stringReceived = `Received ${collectionType}`;
    const printLabel = getLabelPrinter(stringExpected, stringReceived);
    expect(printLabel(stringExpected)).toBe('Expected value: ');
    expect(printLabel(stringReceived)).toBe('Received array: ');
  });
  test('2 unequal lengths', () => {
    const stringExpected = 'Expected value';
    const collectionType = 'set';
    const stringReceived = `Received ${collectionType}`;
    const printLabel = getLabelPrinter(stringExpected, stringReceived);
    expect(printLabel(stringExpected)).toBe('Expected value: ');
    expect(printLabel(stringReceived)).toBe('Received set:   ');
  });
  test('returns incorrect padding if inconsistent arg is shorter', () => {
    const stringConsistent = 'Expected';
    const stringInconsistent = 'Received value';
    const stringInconsistentShorter = 'Received set';
    const printLabel = getLabelPrinter(stringConsistent, stringInconsistent);
    expect(printLabel(stringConsistent)).toBe('Expected:       ');
    expect(printLabel(stringInconsistentShorter)).toBe('Received set:   ');
  });
  test('throws if inconsistent arg is longer', () => {
    const stringConsistent = 'Expected';
    const stringInconsistent = 'Received value';
    const stringInconsistentLonger = 'Received string';
    const printLabel = getLabelPrinter(stringConsistent, stringInconsistent);
    expect(printLabel(stringConsistent)).toBe('Expected:       ');
    expect(() => {
      printLabel(stringInconsistentLonger);
    }).toThrow('Invalid count value');
  });
});

describe('matcherHint', () => {
  test('expectedColor', () => {
    const expectedColor = (arg: string): string => arg; // default (black) color
    const expectedArgument = 'n';
    const received = matcherHint(
      'toHaveBeenNthCalledWith',
      'jest.fn()',
      expectedArgument,
      {expectedColor, secondArgument: '...expected'},
    );

    const substringNegative = pico.green(expectedArgument);

    expect(received).not.toMatch(substringNegative);
  });

  test('receivedColor', () => {
    const receivedColor = (arg: string): string => pico.cyan(pico.bgBlue(arg));
    const receivedArgument = 'received';
    const received = matcherHint('toMatchSnapshot', receivedArgument, '', {
      receivedColor,
    });

    const substringNegative = pico.red(receivedArgument);
    const substringPositive = receivedColor(receivedArgument);

    expect(received).not.toMatch(substringNegative);
    expect(received).toMatch(substringPositive);
  });

  test('secondArgumentColor', () => {
    const secondArgumentColor = pico.bold;
    const secondArgument = 'hint';
    const received = matcherHint('toMatchSnapshot', undefined, 'properties', {
      secondArgument,
      secondArgumentColor,
    });

    const substringNegative = pico.green(secondArgument);
    const substringPositive = secondArgumentColor(secondArgument);

    expect(received).not.toMatch(substringNegative);
    expect(received).toMatch(substringPositive);
  });
});

describe('printDiffOrStringify', () => {
  test('expected asymmetric matchers should be diffable', () => {
    jest.dontMock('jest-diff');
    jest.resetModules();
    const {printDiffOrStringify} = require('../');

    const expected = expect.objectContaining({
      array: [
        {
          3: 'three',
          four: '4',
          one: 1,
          two: 2,
        },
      ],
      foo: 'bar',
    });
    const received = {
      array: [
        {
          3: 'three',
          four: '4',
          one: 1,
          two: 1,
        },
      ],
      foo: 'bar',
    };
    expect(
      printDiffOrStringify(expected, received, 'Expected', 'Received', false),
    ).toMatchSnapshot();
  });
});
