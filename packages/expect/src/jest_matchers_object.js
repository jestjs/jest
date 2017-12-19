/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

export const getState = () => global[JEST_MATCHERS_OBJECT].state;

export const setState = (state: Object) => {
  Object.assign(global[JEST_MATCHERS_OBJECT].state, state);
};

export const getMatchers = () => global[JEST_MATCHERS_OBJECT].matchers;

export const setMatchers = (matchers: MatchersObject) => {
  Object.assign(global[JEST_MATCHERS_OBJECT].matchers, matchers);
};
