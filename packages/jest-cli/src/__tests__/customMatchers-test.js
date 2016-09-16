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

const JasmineFormatter = require('jest-util').JasmineFormatter;

const formatter = new JasmineFormatter(jasmine, {global: {}});

const NOT_EXPECTED_VALUES_LAST_TIME =
  `Wasn't last called with the expected values.\n` +
  `Expected call:\n${formatter.prettyPrint([1, {}, 'Error'])}\n` +
  `Actual call:\n${formatter.prettyPrint([1, {}, ''])}`;

const SHOULD_NOT_HAVE_LAST_CALLED_WITH =
  `Shouldn't have been last called with\n${formatter.prettyPrint([1, {}, ''])}`;

const getMockedFunctionWithExpectationResult = expectationResult => {
  const mockedFunction = jest.fn();
  const expectation = expect(mockedFunction);
  expectation.addExpectationResult =
    expectation.not.addExpectationResult =
      expectationResult;
  expectation.function = mockedFunction;
  return expectation;
};

describe('jasmine', () => {

  describe('when using a getter for a custom matcher message', () => {

    it(`doesn't access message if test passes`, () => {
      if (jasmine.addMatchers) {
        let actual = false;
        jasmine.addMatchers({
          toTestJasmine: () => ({
            compare: () => ({
              pass: true,
              get message() {
                actual = true;
                return 'should never be called';
              },
            }),
          }),
        });
        const expectation = getMockedFunctionWithExpectationResult(
          (passed, result) => {
            expect(passed).toBe(true);
            expect(result.message).toBe('');
          },
        );
        expectation.toTestJasmine();
        expect(actual).toBe(false);
      }
    });

    it('accesses the message when the test fails', () => {
      if (jasmine.addMatchers) {
        const SHOULD_BE_CALLED = 'should be called';
        let actual = false;
        jasmine.addMatchers({
          toTestJasmine: () => ({
            compare: () => ({
              pass: false,
              get message() {
                actual = true;
                return SHOULD_BE_CALLED;
              },
            }),
          }),
        });

        const expectation = getMockedFunctionWithExpectationResult(
          (passed, result) => {
            expect(passed).toBe(false);
            expect(result.message).toBe(SHOULD_BE_CALLED);
          },
        );
        expectation.toTestJasmine();
        expect(actual).toBe(true);
      }
    });

  });

});

describe('Jest custom matchers in Jasmine 2', () => {

  describe('lastCalledWith', () => {

    it(`doesn't show any message when succeding`, () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(true);
          expect(result.message).toBe('');
        },
      );
      expectation.function(1, {}, '');
      expectation.lastCalledWith(1, {}, '');
    });

    it('shows another message for failing a "not" expression', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(false);
          expect(result.message).toBe(SHOULD_NOT_HAVE_LAST_CALLED_WITH);
        },
      );
      expectation.function(1, {}, '');
      expectation.not.lastCalledWith(1, {}, '');
    });

    it('shows a custom message when the test fails', () => {
      const expectation = getMockedFunctionWithExpectationResult(
        (passed, result) => {
          expect(passed).toBe(false);
          expect(result.message).toBe(NOT_EXPECTED_VALUES_LAST_TIME);
        },
      );

      expectation.function(1, {}, '');
      expectation.lastCalledWith(1, {}, 'Error');
    });

  });

});
