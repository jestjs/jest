/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Global} from '@jest/types';
import each from '../';

const noop = () => {};
const expectFunction = expect.any(Function);

const get = <T>(
  object: T,
  lensPath: Array<string>,
): ((...args: Array<unknown>) => unknown) =>
  lensPath.reduce((acc, key) => acc[key], object);

const getGlobalTestMocks =
  (): jest.MockedObject<Global.TestFrameworkGlobals> => {
    const globals: any = {
      describe: jest.fn(),
      fdescribe: jest.fn(),
      fit: jest.fn(),
      it: jest.fn(),
      test: jest.fn(),
      xdescribe: jest.fn(),
      xit: jest.fn(),
      xtest: jest.fn(),
    };
    globals.test.only = jest.fn();
    globals.test.skip = jest.fn();
    globals.test.concurrent = jest.fn();
    globals.test.concurrent.only = jest.fn();
    globals.test.concurrent.skip = jest.fn();
    globals.it.only = jest.fn();
    globals.it.skip = jest.fn();
    globals.describe.only = jest.fn();
    globals.describe.skip = jest.fn();
    return globals;
  };

describe('jest-each', () => {
  for (const keyPath of [
    ['test'],
    ['test', 'concurrent'],
    ['test', 'concurrent', 'only'],
    ['test', 'concurrent', 'skip'],
    ['test', 'only'],
    ['it'],
    ['fit'],
    ['it', 'only'],
    ['describe'],
    ['fdescribe'],
    ['describe', 'only'],
  ]) {
    describe(`.${keyPath.join('.')}`, () => {
      test('throws error when there are additional words in first column heading', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a is the left | b    | expected
          ${1}          | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('does not throw error when there are multibyte characters in first column headings', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
         ʅ(ツ)ʃ  | b    | expected
          ${1}          | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('accept multibyte characters', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() => jest.mocked(globalMock).mock.calls[0][1]()).not.toThrow();
        expect(testCallBack).toHaveBeenCalledWith({
          b: 1,
          expected: 2,
          'ʅ(ツ)ʃ': 1,
        });
      });

      test('throws error when there are additional words in second column heading', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b is the right | expected
          ${1}          | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('does not throw error when there are multibyte characters in second column headings', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | ☝(ʕ⊙ḕ⊙ʔ)☝  | expected
          ${1} | ${1}           | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('accept multibyte characters', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() => jest.mocked(globalMock).mock.calls[0][1]()).not.toThrow();
        expect(testCallBack).toHaveBeenCalledWith({
          a: 1,
          expected: 2,
          '☝(ʕ⊙ḕ⊙ʔ)☝': 1,
        });
      });

      test('throws error when there are additional words in last column heading', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected value
          ${1}          | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('does not throw error when there are multibyte characters in last column headings', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | (๑ఠ‿ఠ๑)＜expected
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('accept multibyte characters', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() => jest.mocked(globalMock).mock.calls[0][1]()).not.toThrow();
        expect(testCallBack).toHaveBeenCalledWith({
          '(๑ఠ‿ఠ๑)＜expected': 2,
          a: 1,
          b: 1,
        });
      });

      test('does not throw error when there is additional words in template after heading row', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          foo
          bar
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('test title', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'test title',
          expectFunction,
          undefined,
        );
      });

      test('does not throw error when there is only one column', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a
          ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('test title', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'test title',
          expectFunction,
          undefined,
        );
      });

      test('does not throw error when there is only one column with additional words in template after heading', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a
          hello world
          ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('test title $a', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'test title 1',
          expectFunction,
          undefined,
        );
      });

      test('throws error when there are no arguments for given headings', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('throws error when there are fewer arguments than headings when given one row', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} |
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('throws error when there are fewer arguments than headings over multiple rows', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} |
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('throws an error when called with an empty string', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`   `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() =>
          jest.mocked(globalMock).mock.calls[0][1](),
        ).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('calls global with given title', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
      });

      test('calls global with title containing param values when using $variable format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction(
          'expected string: a=$a, b=$b, expected=$expected index=$#',
          noop,
        );

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=0, b=1, expected=1 index=0',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=1, b=1, expected=2 index=1',
          expectFunction,
          undefined,
        );
      });

      test('calls global with title containing $key in multiple positions', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction(
          'add($a, $b) expected string: a=$a, b=$b, expected=$expected index=$#',
          noop,
        );

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'add(0, 1) expected string: a=0, b=1, expected=1 index=0',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'add(1, 1) expected string: a=1, b=1, expected=2 index=1',
          expectFunction,
          undefined,
        );
      });

      test('calls global with title containing $key.path', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a
          ${{foo: {bar: 'baz'}}}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('interpolates object keyPath to value: $a.foo.bar', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'interpolates object keyPath to value: baz',
          expectFunction,
          undefined,
        );
      });

      test.each([null, undefined])(
        'calls global with title containing $key.path for %s',
        value => {
          const globalTestMocks = getGlobalTestMocks();
          const eachObject = each.withGlobal(globalTestMocks)`
          a
          ${{foo: value}}
        `;
          const testFunction = get(eachObject, keyPath);
          testFunction(
            'interpolates object keyPath to value: $a.foo.bar',
            noop,
          );

          const globalMock = get(globalTestMocks, keyPath);
          expect(globalMock).toHaveBeenCalledTimes(1);
          expect(globalMock).toHaveBeenCalledWith(
            `interpolates object keyPath to value: ${value}`,
            expectFunction,
            undefined,
          );
        },
      );

      test('calls global with title containing last seen object when $key.path is invalid', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a
          ${{foo: {bar: 'baz'}}}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('interpolates object keyPath to value: $a.foo.qux', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'interpolates object keyPath to value: {"bar": "baz"}',
          expectFunction,
          undefined,
        );
      });

      test('calls global with cb function with object built from table headings and values', () => {
        const globalTestMocks = getGlobalTestMocks();
        const testCallBack = jest.fn();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        jest.mocked(globalMock).mock.calls[0][1]();
        expect(testCallBack).toHaveBeenCalledTimes(1);
        expect(testCallBack).toHaveBeenCalledWith({a: 0, b: 1, expected: 1});

        jest.mocked(globalMock).mock.calls[1][1]();
        expect(testCallBack).toHaveBeenCalledTimes(2);
        expect(testCallBack).toHaveBeenCalledWith({a: 1, b: 1, expected: 2});
      });

      test('calls global with given timeout', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;

        const testFunction = get(eachObject, keyPath);
        testFunction('some test', noop, 10_000);
        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledWith(
          'some test',
          expect.any(Function),
          10_000,
        );
      });

      test('formats primitive values using .toString()', () => {
        const globalTestMocks = getGlobalTestMocks();
        const number = 1;
        const string = 'hello';
        const boolean = true;
        const symbol = Symbol('world');
        const nullValue = null;
        const undefinedValue = undefined;
        const eachObject = each.withGlobal(globalTestMocks)`
          number | string | boolean | symbol | nullValue | undefinedValue
          ${number} | ${string} | ${boolean} | ${symbol} | ${nullValue} | ${undefinedValue}
        `;

        const testFunction = get(eachObject, keyPath);
        testFunction(
          'number: $number | string: $string | boolean: $boolean | symbol: $symbol | null: $nullValue | undefined: $undefinedValue',
          noop,
        );
        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledWith(
          'number: 1 | string: hello | boolean: true | symbol: Symbol(world) | null: null | undefined: undefined',
          expect.any(Function),
          undefined,
        );
      });
    });
  }

  describe('done callback', () => {
    test.each([
      [['test']],
      [['test', 'only']],
      [['test', 'concurrent', 'only']],
      [['it']],
      [['fit']],
      [['it', 'only']],
    ])(
      'calls %O with done when cb function has more args than params of given test row',
      keyPath => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
        a    | b    | expected
        ${0} | ${1} | ${1}
      `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', ({a, b, expected}, done) => {
          expect(a).toBe(0);
          expect(b).toBe(1);
          expect(expected).toBe(1);
          expect(done).toBe('DONE');
        });
        get(globalTestMocks, keyPath).mock.calls[0][1]('DONE');
      },
    );

    test.each([[['describe']], [['fdescribe']], [['describe', 'only']]])(
      'does not call %O with done when test function has more args than params of given test row',
      keyPath => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
        a    | b    | expected
        ${0} | ${1} | ${1}
      `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', function ({a, b, expected}, done) {
          expect(a).toBe(0);
          expect(b).toBe(1);
          expect(expected).toBe(1);
          expect(done).toBeUndefined();
          // eslint-disable-next-line prefer-rest-params
          expect(arguments).toHaveLength(1);
        });
        get(globalTestMocks, keyPath).mock.calls[0][1]('DONE');
      },
    );
  });

  for (const keyPath of [
    ['xtest'],
    ['test', 'skip'],
    ['test', 'concurrent'],
    ['test', 'concurrent', 'skip'],
    ['xit'],
    ['it', 'skip'],
    ['xdescribe'],
    ['describe', 'skip'],
  ]) {
    describe(`.${keyPath.join('.')}`, () => {
      test('calls global with given title', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
          undefined,
        );
      });

      test('calls global with title containing param values when using $variable format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction(
          'expected string: a=$a, b=$b, expected=$expected index=$#',
          noop,
        );

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=0, b=1, expected=1 index=0',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=1, b=1, expected=2 index=1',
          expectFunction,
          undefined,
        );
      });

      test('calls global with title containing param values when using fake $variable', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction(
          'expected string: a=$a, b=$b, b=$b, b=$b.b, b=$fake, expected=$expected index=$#',
          noop,
        );

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=0, b=1, b=1, b=1, b=$fake, expected=1 index=0',
          expectFunction,
          undefined,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: a=1, b=1, b=1, b=1, b=$fake, expected=2 index=1',
          expectFunction,
          undefined,
        );
      });
    });
  }
});
