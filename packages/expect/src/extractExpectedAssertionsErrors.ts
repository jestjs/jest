/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {equals, iterableEquality, subsetEquality} from '@jest/expect-utils';
import * as matcherUtils from 'jest-matcher-utils';
import {getState, setState} from './jestMatchersObject';
import type {
  Expect,
  ExpectedAssertionsErrors,
  MatcherContext,
  MatcherState,
  MatcherUtils,
} from './types';

const resetAssertionsLocalState = () => {
  setState({
    assertionCalls: 0,
    expectedAssertionsNumber: null,
    isExpectingAssertions: false,
    numPassingAsserts: 0,
  });
};

const utils: MatcherUtils['utils'] = {
  ...matcherUtils,
  iterableEquality,
  subsetEquality,
};

const matcherUtilsThing: MatcherUtils = {
  dontThrow: () => {
    // nothing
  },
  equals,
  utils,
};

// Create and format all errors related to the mismatched number of `expect`
// calls and reset the matcher's state.
const extractExpectedAssertionsErrors: Expect['extractExpectedAssertionsErrors'] =
  () => {
    const matcherContext: MatcherContext = {
      ...getState<MatcherState>(),
      ...matcherUtilsThing,
    };
    const result: ExpectedAssertionsErrors = [];
    const {
      assertionCalls,
      expectedAssertionsNumber,
      expectedAssertionsNumberError,
      isExpectingAssertions,
      isExpectingAssertionsError,
    } = getState();

    resetAssertionsLocalState();

    if (
      typeof expectedAssertionsNumber === 'number' &&
      assertionCalls !== expectedAssertionsNumber
    ) {
      const numOfAssertionsExpected = matcherContext.utils.EXPECTED_COLOR(
        matcherContext.utils.pluralize('assertion', expectedAssertionsNumber),
      );

      expectedAssertionsNumberError!.message =
        `${matcherContext.utils.matcherHint(
          '.assertions',
          '',
          expectedAssertionsNumber.toString(),
          {isDirectExpectCall: true},
        )}\n\n` +
        `Expected ${numOfAssertionsExpected} to be called but received ${matcherContext.utils.RECEIVED_COLOR(
          matcherContext.utils.pluralize('assertion call', assertionCalls || 0),
        )}.`;

      result.push({
        actual: assertionCalls.toString(),
        error: expectedAssertionsNumberError!,
        expected: expectedAssertionsNumber.toString(),
      });
    }
    if (isExpectingAssertions && assertionCalls === 0) {
      const expected = matcherContext.utils.EXPECTED_COLOR(
        'at least one assertion',
      );
      const received = matcherContext.utils.RECEIVED_COLOR('received none');

      isExpectingAssertionsError!.message = `${matcherContext.utils.matcherHint(
        '.hasAssertions',
        '',
        '',
        {isDirectExpectCall: true},
      )}\n\nExpected ${expected} to be called but ${received}.`;

      result.push({
        actual: 'none',
        error: isExpectingAssertionsError!,
        expected: 'at least one',
      });
    }

    return result;
  };

export default extractExpectedAssertionsErrors;
