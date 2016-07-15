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
    ensureSpy(actual, 'toHaveBeenCalled');

    const pass = actual.calls.any();
    const message = pass
      ? `expected a spy to not be called, but it was` +
        ` called ${actual.calls.count()} times`
      : `expected a spy to be called but it wasn't`;

    return {message, pass};
  },

  toHaveBeenCalledTimes(actual: any, expected: number) {
    ensureExpectedIsNumber(expected, 'toHaveBeenCalledTimes');
    ensureSpy(actual, 'toHaveBeenCalledTimes');

    const pass = actual.calls.count() === expected;
    const message = pass
      ? `expected a spy to not be called ${expected} times,` +
        ` but it was called ${actual.calls.count()} times`
      : `expected a spy to be called ${expected} times,` +
        ` but it was called ${actual.calls.count()} times`;

    return {message, pass};
  },
};

const ensureSpy = (spy, matcherName) => {
  if (spy.calls === undefined || spy.calls.all === undefined) {
    throw new Error(
      `${matcherName} matcher can only execute on a Spy function`);
  }
};

module.exports = spyMatchers;
