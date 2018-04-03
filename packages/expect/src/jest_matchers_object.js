/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {AsymmetricMatcher} from './asymmetric_matchers';
import type {
  Expect,
  MatchersObject,
  SyncExpectationResult,
} from 'types/Matchers';

// Global matchers object holds the list of available matchers and
// the state, that can hold matcher specific values that change over time.
const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');

// Notes a built-in/internal Jest matcher.
// Jest may override the stack trace of Errors thrown by internal matchers.
export const INTERNAL_MATCHER_FLAG = Symbol.for('$$jest-internal-matcher');

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

export const setMatchers = (
  matchers: MatchersObject,
  isInternal: boolean,
  expect: Expect,
) => {
  Object.keys(matchers).forEach(key => {
    const matcher = matchers[key];
    Object.defineProperty(matcher, INTERNAL_MATCHER_FLAG, {
      value: isInternal,
    });

    if (!isInternal) {
      // expect is defined

      class CustomMatcher extends AsymmetricMatcher {
        sample: any;

        constructor(sample: any, inverse: boolean = false) {
          super();
          this.sample = sample;
          this.inverse = inverse;
        }

        asymmetricMatch(other: any) {
          const {pass} = ((matcher(
            (other: any),
            (this.sample: any),
          ): any): SyncExpectationResult);

          return this.inverse ? !pass : pass;
        }

        toString() {
          return `${this.inverse ? 'not.' : ''}${key}`;
        }

        getExpectedType() {
          return 'any';
        }

        toAsymmetricMatcher() {
          return `${this.toString()}<${this.sample}>`;
        }
      }

      expect[key] = (sample: any) => new CustomMatcher(sample);
      if (!expect.not) {
        expect.not = {};
      }
      expect.not[key] = (sample: any) => new CustomMatcher(sample, true);
    }
  });

  Object.assign(global[JEST_MATCHERS_OBJECT].matchers, matchers);
};
