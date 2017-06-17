/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherHint,
  pluralize,
} from 'jest-matcher-utils';

import {getState, setState} from './jest-matchers-object';

// Create and format all errors related to the mismatched number of `expect`
// calls and reset the matchers state.
const extractExpectedAssertionsErrors = () => {
  const result = [];
  const {
    assertionCalls,
    expectedAssertionsNumber,
    isExpectingAssertions,
  } = getState();
  setState({assertionCalls: 0, expectedAssertionsNumber: null});
  if (
    typeof expectedAssertionsNumber === 'number' &&
    assertionCalls !== expectedAssertionsNumber
  ) {
    const numOfAssertionsExpected = EXPECTED_COLOR(
      pluralize('assertion', expectedAssertionsNumber),
    );
    const message = new Error(
      matcherHint('.assertions', '', String(expectedAssertionsNumber), {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${numOfAssertionsExpected} to be called but only received ` +
        RECEIVED_COLOR(pluralize('assertion call', assertionCalls || 0)) +
        '.',
    );
    const error = {
      actual: assertionCalls,
      expected: expectedAssertionsNumber,
      message,
      passed: false,
    };
    result.push(error);
  }
  if (isExpectingAssertions && assertionCalls === 0) {
    const expected = EXPECTED_COLOR('at least one assertion');
    const received = RECEIVED_COLOR('received none');
    const message = new Error(
      matcherHint('.hasAssertions', '', '', {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${expected} to be called but ${received}.`,
    );
    const error = {
      actual: 'none',
      expected: 'at least one',
      message,
      passed: false,
    };
    result.push(error);
  }

  return result;
};

module.exports = extractExpectedAssertionsErrors;
