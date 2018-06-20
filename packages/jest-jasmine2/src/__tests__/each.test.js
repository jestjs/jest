/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import installEach from '../each';

const noop = () => {};
const expectFunction = expect.any(Function);

describe('installEach', () => {
  [
    ['it'],
    ['fit'],
    ['xit'],
    ['describe'],
    ['fdescribe'],
    ['xdescribe'],
  ].forEach(keyPath => {
    describe(`.${keyPath.join('.')}`, () => {
      const getEnvironmentMock = () => ({
        global: {
          describe: jest.fn(),
          fdescribe: jest.fn(),
          fit: jest.fn(),
          it: jest.fn(),
          xdescribe: jest.fn(),
          xit: jest.fn(),
        },
      });

      describe('Table Array', () => {
        test('calls global function with given title', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each([[]])('expected string', noop);

          expect(globalMock).toHaveBeenCalledTimes(1);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
        });

        test('calls global function with given title when multiple tests cases exist', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each([[], []])('expected string', noop);

          expect(globalMock).toHaveBeenCalledTimes(2);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
        });

        test('calls global function with title containing param values when using sprintf format', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each([['hello', 1], ['world', 2]])(
            'expected string: %s %s',
            noop,
          );

          expect(globalMock).toHaveBeenCalledTimes(2);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string: hello 1',
            expectFunction,
          );
          expect(globalMock).toHaveBeenCalledWith(
            'expected string: world 2',
            expectFunction,
          );
        });

        test('calls global function with cb function containing all parameters of each test case', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          const testCallBack = jest.fn();
          globalMock.each([['hello', 'world'], ['joe', 'bloggs']])(
            'expected string: %s %s',
            testCallBack,
          );

          globalMock.mock.calls[0][1]();
          expect(testCallBack).toHaveBeenCalledTimes(1);
          expect(testCallBack).toHaveBeenCalledWith('hello', 'world');

          globalMock.mock.calls[1][1]();
          expect(testCallBack).toHaveBeenCalledTimes(2);
          expect(testCallBack).toHaveBeenCalledWith('joe', 'bloggs');
        });

        test('calls global function with async done when cb function has more args than params of given test row', () => {
          expect.hasAssertions();
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          globalMock.each([['hello']])('a title', (hello, done) => {
            expect(hello).toBe('hello');
            expect(done).toBe('DONE');
          });

          globalMock.mock.calls[0][1]('DONE');
        });
      });

      describe('Table Tagged Template Literal', () => {
        test('throws error when there are fewer arguments than headings when given one row', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          const testCallBack = jest.fn();

          globalMock.each`
            a    | b    | expected
            ${0} | ${1} |
          `('this will blow up :(', testCallBack);

          expect(() =>
            globalMock.mock.calls[0][1](),
          ).toThrowErrorMatchingSnapshot();
          expect(testCallBack).not.toHaveBeenCalled();
        });

        test('throws error when there are fewer arguments than headings over multiple rows', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          const testCallBack = jest.fn();

          globalMock.each`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} |
        `('this will blow up :(', testCallBack);

          expect(() =>
            globalMock.mock.calls[0][1](),
          ).toThrowErrorMatchingSnapshot();
          expect(testCallBack).not.toHaveBeenCalled();
        });

        test('calls global function with given title', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each`
            a    | b    | expected
            ${0} | ${1} | ${1}
          `('expected string', noop);

          expect(globalMock).toHaveBeenCalledTimes(1);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
        });

        test('calls global function with given title when multiple tests cases exist', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each`
            a    | b    | expected
            ${0} | ${1} | ${1}
            ${1} | ${1} | ${2}
          `('expected string', noop);

          expect(globalMock).toHaveBeenCalledTimes(2);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
          expect(globalMock).toHaveBeenCalledWith(
            'expected string',
            expectFunction,
          );
        });

        test('calls global function with title containing param values when using $variable format', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];

          globalMock.each`
            a    | b    | expected
            ${0} | ${1} | ${1}
            ${1} | ${1} | ${2}
          `('expected string: a=$a, b=$b, expected=$expected', noop);

          expect(globalMock).toHaveBeenCalledTimes(2);
          expect(globalMock).toHaveBeenCalledWith(
            'expected string: a=0, b=1, expected=1',
            expectFunction,
          );
          expect(globalMock).toHaveBeenCalledWith(
            'expected string: a=1, b=1, expected=2',
            expectFunction,
          );
        });

        test('calls global function with cb function containing all parameters of each test case', () => {
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          const testCallBack = jest.fn();
          globalMock.each`
            a    | b    | expected
            ${0} | ${1} | ${1}
            ${1} | ${1} | ${2}
          `('expected string: %s %s', testCallBack);

          globalMock.mock.calls[0][1]();
          expect(testCallBack).toHaveBeenCalledTimes(1);

          expect(testCallBack).toHaveBeenCalledWith({a: 0, b: 1, expected: 1});

          globalMock.mock.calls[1][1]();
          expect(testCallBack).toHaveBeenCalledTimes(2);
          expect(testCallBack).toHaveBeenCalledWith({a: 1, b: 1, expected: 2});
        });

        test('calls global function with async done when cb function has more than one argument', () => {
          expect.hasAssertions();
          const environmentMock = getEnvironmentMock();
          installEach(environmentMock);

          const globalMock = environmentMock.global[keyPath];
          globalMock.each`
            a    | b    | expected
            ${0} | ${1} | ${1}
          `('a title', ({a, b, expected}, done) => {
            expect(a).toBe(0);
            expect(b).toBe(1);
            expect(expected).toBe(1);
            expect(done).toBe('DONE');
          });

          globalMock.mock.calls[0][1]('DONE');
        });
      });
    });
  });
});
