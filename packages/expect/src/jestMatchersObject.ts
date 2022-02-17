/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {AsymmetricMatcher} from './asymmetricMatchers';
import type {
  Expect,
  MatcherState,
  MatchersObject,
  SyncExpectationResult,
} from './types';

// Global matchers object holds the list of available matchers and
// the state, that can hold matcher specific values that change over time.
const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');

// Notes a built-in/internal Jest matcher.
// Jest may override the stack trace of Errors thrown by internal matchers.
export const INTERNAL_MATCHER_FLAG = Symbol.for('$$jest-internal-matcher');

if (!Object.prototype.hasOwnProperty.call(global, JEST_MATCHERS_OBJECT)) {
  const defaultState: Partial<MatcherState> = {
    assertionCalls: 0,
    expectedAssertionsNumber: null,
    isExpectingAssertions: false,
    suppressedErrors: [], // errors that are not thrown immediately.
  };
  Object.defineProperty(global, JEST_MATCHERS_OBJECT, {
    value: {
      matchers: Object.create(null),
      state: defaultState,
    },
  });
}

export const getState = <State extends MatcherState = MatcherState>(): State =>
  (global as any)[JEST_MATCHERS_OBJECT].state;

export const setState = <State extends MatcherState = MatcherState>(
  state: Partial<State>,
): void => {
  Object.assign((global as any)[JEST_MATCHERS_OBJECT].state, state);
};

export const getMatchers = (): MatchersObject =>
  (global as any)[JEST_MATCHERS_OBJECT].matchers;

export const setMatchers = (
  matchers: MatchersObject,
  isInternal: boolean,
  expect: Expect,
): void => {
  Object.keys(matchers).forEach(key => {
    const matcher = matchers[key];
    Object.defineProperty(matcher, INTERNAL_MATCHER_FLAG, {
      value: isInternal,
    });

    if (!isInternal) {
      // expect is defined

      class CustomMatcher extends AsymmetricMatcher<
        [unknown, ...Array<unknown>]
      > {
        constructor(inverse = false, ...sample: [unknown, ...Array<unknown>]) {
          super(sample, inverse);
        }

        asymmetricMatch(other: unknown) {
          const {pass} = matcher.call(
            this.getMatcherContext(),
            other,
            ...this.sample,
          ) as SyncExpectationResult;

          return this.inverse ? !pass : pass;
        }

        toString() {
          return `${this.inverse ? 'not.' : ''}${key}`;
        }

        getExpectedType() {
          return 'any';
        }

        toAsymmetricMatcher() {
          return `${this.toString()}<${this.sample.map(String).join(', ')}>`;
        }
      }

      Object.defineProperty(expect, key, {
        configurable: true,
        enumerable: true,
        value: (...sample: [unknown, ...Array<unknown>]) =>
          new CustomMatcher(false, ...sample),
        writable: true,
      });
      Object.defineProperty(expect.not, key, {
        configurable: true,
        enumerable: true,
        value: (...sample: [unknown, ...Array<unknown>]) =>
          new CustomMatcher(true, ...sample),
        writable: true,
      });
    }
  });

  Object.assign((global as any)[JEST_MATCHERS_OBJECT].matchers, matchers);
};
