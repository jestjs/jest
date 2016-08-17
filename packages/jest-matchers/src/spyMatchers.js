/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {MatchersObject} from './types';

const {
  ensureNoExpected,
  ensureExpectedIsNumber,
} = require('jest-matcher-utils');

const spyMatchers: MatchersObject = {
  toHaveBeenCalled(actual: any, expected: void) {
    ensureNoExpected(expected, 'toHaveBeenCalled');
    ensureMockOrSpy(actual, 'toHaveBeenCalled');

    return isSpy(actual)
    ? jasmineToHaveBeenCalled(actual)
      : jestToHaveBeenCalled(actual);
  },

  toBeCalled(actual: any, expected: void) {
    ensureNoExpected(expected, 'toBeCalled');
    ensureMockOrSpy(actual, 'toBeCalled');
    return isSpy(actual)
      ? jasmineToHaveBeenCalled(actual)
      : jestToHaveBeenCalled(actual);
  },

  toHaveBeenCalledTimes(actual: any, expected: number) {
    ensureExpectedIsNumber(expected, 'toHaveBeenCalledTimes');
    ensureMockOrSpy(actual, 'toHaveBeenCalledTimes');

    const count = isSpy(actual)
      ? actual.calls.count()
      : actual.mock.calls.length;
    const pass = count === expected;
    const message = pass
      ? `expected a spy to not be called ${expected} times,` +
        ` but it was called ${count} times`
      : `expected a spy to be called ${expected} times,` +
        ` but it was called ${count} times`;

    return {message, pass};
  },
};

const jestToHaveBeenCalled = actual => {
  const pass = actual.mock.calls.length > 0;
  const message = pass
    ? `expected a mock to not be called, but it was` +
      ` called ${actual.mock.calls.length} times`
    : `expected a mock to be called but it wasn't`;

  return {message, pass};
};

const jasmineToHaveBeenCalled = actual => {
  const pass = actual.calls.any();
  const message = pass
    ? `expected a spy to not be called, but it was` +
      ` called ${actual.calls.count()} times`
    : `expected a spy to be called but it wasn't`;

  return {message, pass};
};

const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

const ensureMockOrSpy = (mockOrSpy, matcherName) => {
  if (
    (mockOrSpy.calls === undefined || mockOrSpy.calls.all === undefined) &&
    mockOrSpy._isMockFunction !== true
  ) {
    throw new Error(
      `${matcherName} matcher can only execute on a Spy or Mock function`,
    );
  }
};

module.exports = spyMatchers;
