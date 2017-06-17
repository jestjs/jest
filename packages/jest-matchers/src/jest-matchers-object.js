/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {MatchersObject} from 'types/Matchers';

// Global matchers object holds the list of available matchers and
// the state, that can hold matcher specific values that change over time.
const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');

if (!global[JEST_MATCHERS_OBJECT]) {
  Object.defineProperty(global, JEST_MATCHERS_OBJECT, {
    value: {
      matchers: Object.create(null),
      state: {
        assertionCalls: 0,
        expectedAssertionsNumber: null,
        isExpectingAssertions: false,
        suppressedErrors: [], // errors that are not thrown immediately.
      },
    },
  });
}

const getState = () => global[JEST_MATCHERS_OBJECT].state;

const setState = (state: Object) => {
  Object.assign(global[JEST_MATCHERS_OBJECT].state, state);
};

const getMatchers = () => global[JEST_MATCHERS_OBJECT].matchers;

const setMatchers = (matchers: MatchersObject) => {
  Object.assign(global[JEST_MATCHERS_OBJECT].matchers, matchers);
};

module.exports = {
  getMatchers,
  getState,
  setMatchers,
  setState,
};
