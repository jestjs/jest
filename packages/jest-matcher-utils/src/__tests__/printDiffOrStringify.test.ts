/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import {INVERTED_COLOR, printDiffOrStringify} from '../index';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

describe('printDiffOrStringify', () => {
  const testDiffOrStringify = (expected: unknown, received: unknown): string =>
    printDiffOrStringify(expected, received, 'Expected', 'Received', true);

  test('expected is empty and received is single line', () => {
    const expected = '';
    const received = 'single line';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected is multi line and received is empty', () => {
    const expected = 'multi\nline';
    const received = '';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected and received are single line with multiple changes', () => {
    const expected = 'delete common expected common prev';
    const received = 'insert common received common next';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected and received are multi line with trailing spaces', () => {
    const expected = 'delete \ncommon expected common\nprev ';
    const received = 'insert \ncommon received common\nnext ';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('has no common after clean up chaff multiline', () => {
    const expected = 'delete\ntwo';
    const received = 'insert\n2';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('has no common after clean up chaff one-line', () => {
    const expected = 'delete';
    const received = 'insert';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('object contain readonly symbol key object', () => {
    const expected = {b: 2};
    const received = {b: 1};
    const symbolKey = Symbol.for('key');
    Object.defineProperty(expected, symbolKey, {
      configurable: true,
      enumerable: true,
      value: {
        a: 1,
      },
      writable: false,
    });
    Object.defineProperty(received, symbolKey, {
      configurable: true,
      enumerable: true,
      value: {
        a: 1,
      },
      writable: false,
    });
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  describe('MAX_DIFF_STRING_LENGTH', () => {
    const lessChange = INVERTED_COLOR('single ');
    const less = 'single line';
    const more = `multi line${'\n123456789'.repeat(2000)}`; // 10 + 20K chars

    test('both are less', () => {
      const difference = testDiffOrStringify('multi\nline', less);

      expect(difference).toMatch('- multi');
      expect(difference).toMatch('- line');

      // diffStringsUnified has substring change
      expect(difference).not.toMatch('+ single line');
      expect(difference).toMatch(lessChange);
    });

    test('expected is more', () => {
      const difference = testDiffOrStringify(more, less);

      expect(difference).toMatch('- multi line');
      expect(difference).toMatch('+ single line');

      // diffLinesUnified does not have substring change
      expect(difference).not.toMatch(lessChange);
    });

    test('received is more', () => {
      const difference = testDiffOrStringify(less, more);

      expect(difference).toMatch('- single line');
      expect(difference).toMatch('+ multi line');

      // diffLinesUnified does not have substring change
      expect(difference).not.toMatch(lessChange);
    });
  });

  describe('asymmetricMatcher', () => {
    test('minimal test', () => {
      const expected = {a: expect.any(Number), b: 2};
      const received = {a: 1, b: 1};
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('jest asymmetricMatcher', () => {
      const expected = {
        a: expect.any(Number),
        b: expect.anything(),
        c: expect.arrayContaining([1, 3]),
        d: 'jest is awesome',
        e: 'jest is awesome',
        f: {
          a: new Date(),
          b: 'jest is awesome',
        },
        g: true,
        [Symbol.for('h')]: 'jest is awesome',
      };
      const received = {
        a: 1,
        b: 'anything',
        c: [1, 2, 3],
        d: expect.stringContaining('jest'),
        e: expect.stringMatching(/^jest/),
        f: expect.objectContaining({
          a: expect.any(Date),
        }),
        g: false,
        [Symbol.for('h')]: expect.any(String),
      };

      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('custom asymmetricMatcher', () => {
      expect.extend({
        equal5(received: unknown) {
          if (received === 5)
            return {
              message: () => `expected ${received} not to be 5`,
              pass: true,
            };
          return {
            message: () => `expected ${received} to be 5`,
            pass: false,
          };
        },
      });
      const expected = {
        a: expect.equal5(),
        b: false,
      };
      const received = {
        a: 5,
        b: true,
      };

      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('nested object', () => {
      const expected = {
        a: 1,
        b: {
          a: 1,
          b: expect.any(Number),
        },
        c: 2,
      };
      const received = {
        a: expect.any(Number),
        b: {
          a: 1,
          b: 2,
        },
        c: 1,
      };
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('array', () => {
      const expected: Array<unknown> = [1, expect.any(Number), 3];
      const received: Array<unknown> = [1, 2, 2];
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('object in array', () => {
      const expected: Array<unknown> = [1, {a: 1, b: expect.any(Number)}, 3];
      const received: Array<unknown> = [1, {a: 1, b: 2}, 2];
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('map', () => {
      const expected = new Map<string, unknown>([
        ['a', 1],
        ['b', expect.any(Number)],
        ['c', 3],
      ]);
      const received = new Map<string, unknown>([
        ['a', 1],
        ['b', 2],
        ['c', 2],
      ]);
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('circular object', () => {
      const expected: any = {
        b: expect.any(Number),
        c: 3,
      };
      expected.a = expected;
      const received: any = {
        b: 2,
        c: 2,
      };
      received.a = received;
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('transitive circular', () => {
      const expected: unknown = {
        a: 3,
      };
      expected.nested = {b: expect.any(Number), parent: expected};
      const received: any = {
        a: 2,
      };
      received.nested = {b: 2, parent: received};
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('circular array', () => {
      const expected: Array<unknown> = [1, expect.any(Number), 3];
      expected.push(expected);
      const received: Array<unknown> = [1, 2, 2];
      received.push(received);
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });

    test('circular map', () => {
      const expected = new Map<string, unknown>([
        ['a', 1],
        ['b', expect.any(Number)],
        ['c', 3],
      ]);
      expected.set('circular', expected);
      const received = new Map<string, unknown>([
        ['a', 1],
        ['b', 2],
        ['c', 2],
      ]);
      received.set('circular', received);
      expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
    });
  });
});
