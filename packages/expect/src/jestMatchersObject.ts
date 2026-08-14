/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Tester} from '@jest/expect-utils';
import {getType} from '@jest/get-type';
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

// Per-test fields that must not be shared when tests run concurrently.
// `currentConcurrentTestName` (set by jest-circus via AsyncLocalStorage)
// identifies the active test; everything else stays on the global state.
type IsolatedMatcherState = {
  assertionCalls: number;
  currentTestName?: string;
  expectedAssertionsNumber: number | null;
  expectedAssertionsNumberError?: Error;
  isExpectingAssertions: boolean;
  isExpectingAssertionsError?: Error;
  numPassingAsserts: number;
  suppressedErrors: Array<Error>;
  testFailing?: boolean;
};

const ISOLATED_STATE_KEYS = [
  'assertionCalls',
  'currentTestName',
  'expectedAssertionsNumber',
  'expectedAssertionsNumberError',
  'isExpectingAssertions',
  'isExpectingAssertionsError',
  'numPassingAsserts',
  'suppressedErrors',
  'testFailing',
] as const satisfies ReadonlyArray<keyof IsolatedMatcherState>;

type IsolatedStateKey = (typeof ISOLATED_STATE_KEYS)[number];

type IsolatedMatcherEntry = {
  isolated: IsolatedMatcherState;
  view: MatcherState;
};

type JestMatchersObject = {
  customEqualityTesters: Array<Tester>;
  isolatedMatcherStates: Map<string, IsolatedMatcherEntry>;
  matchers: MatchersObject;
  state: MatcherState;
};

const isolatedStateKeySet = new Set<string>(ISOLATED_STATE_KEYS);

const isIsolatedStateKey = (key: string | symbol): key is IsolatedStateKey =>
  typeof key === 'string' && isolatedStateKeySet.has(key);

const createIsolatedMatcherState = (): IsolatedMatcherState => ({
  assertionCalls: 0,
  expectedAssertionsNumber: null,
  isExpectingAssertions: false,
  numPassingAsserts: 0,
  suppressedErrors: [],
});

const createIsolatedStateView = (
  globalState: MatcherState,
  isolated: IsolatedMatcherState,
): MatcherState =>
  new Proxy(globalState, {
    get(target, prop, receiver) {
      if (isIsolatedStateKey(prop)) {
        return isolated[prop];
      }
      return Reflect.get(target, prop, receiver);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (isIsolatedStateKey(prop)) {
        return {
          configurable: true,
          enumerable: true,
          value: isolated[prop],
          writable: true,
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return isIsolatedStateKey(prop)
        ? prop in isolated || prop in target
        : Reflect.has(target, prop);
    },
    ownKeys(target) {
      return [
        ...new Set([...Reflect.ownKeys(target), ...Reflect.ownKeys(isolated)]),
      ];
    },
    set(target, prop, value, receiver) {
      if (isIsolatedStateKey(prop)) {
        isolated[prop] = value;
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
  });

if (!Object.prototype.hasOwnProperty.call(globalThis, JEST_MATCHERS_OBJECT)) {
  const defaultState: MatcherState = {
    assertionCalls: 0,
    expectedAssertionsNumber: null,
    isExpectingAssertions: false,
    numPassingAsserts: 0,
    suppressedErrors: [], // errors that are not thrown immediately.
  };
  Object.defineProperty(globalThis, JEST_MATCHERS_OBJECT, {
    value: {
      customEqualityTesters: [],
      isolatedMatcherStates: new Map(),
      matchers: Object.create(null),
      state: defaultState,
    },
  });
}

const getMatchersObject = (): JestMatchersObject => {
  const store = (globalThis as any)[JEST_MATCHERS_OBJECT] as JestMatchersObject;
  // Another copy of `expect` may have created the registry without isolation.
  if (store.isolatedMatcherStates == null) {
    store.isolatedMatcherStates = new Map();
  }
  return store;
};

const getConcurrentTestName = (): string | undefined =>
  getMatchersObject().state.currentConcurrentTestName?.();

const getIsolatedStateView = (testName: string): MatcherState => {
  const store = getMatchersObject();
  const existing = store.isolatedMatcherStates.get(testName);
  if (existing) {
    return existing.view;
  }

  const isolated = createIsolatedMatcherState();
  const view = createIsolatedStateView(store.state, isolated);
  store.isolatedMatcherStates.set(testName, {isolated, view});
  return view;
};

export const getState = <
  State extends MatcherState = MatcherState,
>(): State => {
  const testName = getConcurrentTestName();
  if (testName != null) {
    return getIsolatedStateView(testName) as State;
  }
  return getMatchersObject().state as State;
};

export const setState = <State extends MatcherState = MatcherState>(
  state: Partial<State>,
): void => {
  Object.assign(getState<State>(), state);
};

export const getMatchers = (): MatchersObject =>
  (globalThis as any)[JEST_MATCHERS_OBJECT].matchers;

export const setMatchers = (
  matchers: MatchersObject,
  isInternal: boolean,
  expect: Expect,
): void => {
  for (const key of Object.keys(matchers)) {
    const matcher = matchers[key];

    if (typeof matcher !== 'function') {
      throw new TypeError(
        `expect.extend: \`${key}\` is not a valid matcher. Must be a function, is "${getType(
          matcher,
        )}"`,
      );
    }

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

        override getExpectedType() {
          return 'any';
        }

        override toAsymmetricMatcher() {
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
  }

  Object.assign((globalThis as any)[JEST_MATCHERS_OBJECT].matchers, matchers);
};

export const getCustomEqualityTesters = (): Array<Tester> =>
  (globalThis as any)[JEST_MATCHERS_OBJECT].customEqualityTesters;

export const addCustomEqualityTesters = (newTesters: Array<Tester>): void => {
  if (!Array.isArray(newTesters)) {
    throw new TypeError(
      `expect.customEqualityTesters: Must be set to an array of Testers. Was given "${getType(
        newTesters,
      )}"`,
    );
  }

  (globalThis as any)[JEST_MATCHERS_OBJECT].customEqualityTesters.push(
    ...newTesters,
  );
};
