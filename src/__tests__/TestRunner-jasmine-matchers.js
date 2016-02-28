/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

const CALLED_AT_LEAST_ONCE = 'function expected to be called at least once';
const NOT_EXPECTED_VALUES = [
  'function was never called with the expected values.',
  'Expected:',
  '[1,{},"Error"]',
].join('\n');
const NOT_EXPECTED_VALUES_LAST_TIME = [
  'function wasn\'t called with the expected values.',
  'Expected:',
  '[1,{},"Error"]',
  'Actual:',
  '[1,{},""]',
].join('\n');

const getMockedFunctionWithExpectationResult = (expectationResult) => {
  const mockedFunction = jest.genMockFunction();
  const expectation = expect(mockedFunction);
  if (expectation.addExpectationResult) {
    expectation.addExpectationResult = expectationResult;
  } else {
    // skip this tests for jasmine 1 for now by returning a mocked expectation
    return {
      toBeCalled() {},
      toBeCalledWith() {},
      lastCalledWith() {},
      function: mockedFunction,
    };
  }
  expectation.function = mockedFunction;
  return expectation;
};

describe('TestRunner Jasmine custom matchers', () => {
  describe('toBeCalled', () => {
    it('should show a custom message when failing', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(false);
          expect(result.message).toBe(CALLED_AT_LEAST_ONCE);
        }
      );
      expectation.toBeCalled();
    });

    it('should not show any message when succeding', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(true);
          expect(result.message).toBe('');
        }
      );
      expectation.function();
      expectation.toBeCalled();
    });
  });

  describe('lastCalledWith', () => {
    it('should not show any message when succeding', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(true);
          expect(result.message).toBe('');
        }
      );
      expectation.function(1, {}, '');
      expectation.lastCalledWith(1, {}, '');
    });

    it('should show a message when failing', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(false);
          expect(result.message).toBe(NOT_EXPECTED_VALUES_LAST_TIME);
        }
      );

      expectation.function(1, {}, '');
      expectation.lastCalledWith(1, {}, 'Error');
    });
  });

  describe('toBeCalledWith', () => {
    it('should not show any message when succeding', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(true);
          expect(result.message).toBe('');
        }
      );
      expectation.function(1, {}, '');
      expectation.toBeCalledWith(1, {}, '');
    });

    it('should show a message when failing', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(false);
          expect(result.message).toBe(NOT_EXPECTED_VALUES);
        }
      );

      expectation.function(1, {}, '');
      expectation.toBeCalledWith(1, {}, 'Error');
    });
  });

});
