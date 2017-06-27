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

import {getState, setState} from './jest_matchers_object';

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
    const error = new Error(
      matcherHint('.assertions', '', String(expectedAssertionsNumber), {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${numOfAssertionsExpected} to be called but received ` +
        RECEIVED_COLOR(pluralize('assertion call', assertionCalls || 0)) +
        '.',
    );
    result.push({
      actual: assertionCalls,
      error,
      expected: expectedAssertionsNumber,
    });
  }
  if (isExpectingAssertions && assertionCalls === 0) {
    const expected = EXPECTED_COLOR('at least one assertion');
    const received = RECEIVED_COLOR('received none');
    const error = new Error(
      matcherHint('.hasAssertions', '', '', {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${expected} to be called but ${received}.`,
    );
    result.push({
      actual: 'none',
      error,
      expected: 'at least one',
    });
  }

  return result;
};

module.exports = extractExpectedAssertionsErrors;
