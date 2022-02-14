/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import type {EqualsFunction, Tester} from '@jest/expect-utils';
import {
  type ExpectationResult,
  type MatcherFunction,
  type MatcherFunctionWithContext,
  type MatcherState,
  type Matchers,
  expect,
} from 'expect';
import type * as jestMatcherUtils from 'jest-matcher-utils';

type M = Matchers<void, unknown>;
type N = Matchers<void>;

expectError(() => {
  type E = Matchers;
});

// extend

type MatcherUtils = typeof jestMatcherUtils & {
  iterableEquality: Tester;
  subsetEquality: Tester;
};

// TODO `actual` should be allowed to have only `unknown` type
expectType<void>(
  expect.extend({
    toBeWithinRange(actual: number, floor: number, ceiling: number) {
      expectType<number>(this.assertionCalls);
      expectType<string | undefined>(this.currentTestName);
      expectType<(() => void) | undefined>(this.dontThrow);
      expectType<Error | undefined>(this.error);
      expectType<EqualsFunction>(this.equals);
      expectType<boolean | undefined>(this.expand);
      expectType<number | null | undefined>(this.expectedAssertionsNumber);
      expectType<Error | undefined>(this.expectedAssertionsNumberError);
      expectType<boolean | undefined>(this.isExpectingAssertions);
      expectType<Error | undefined>(this.isExpectingAssertionsError);
      expectType<boolean>(this.isNot);
      expectType<string>(this.promise);
      expectType<Array<Error>>(this.suppressedErrors);
      expectType<string | undefined>(this.testPath);
      expectType<MatcherUtils>(this.utils);

      const pass = actual >= floor && actual <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${actual} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${actual} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
  }),
);

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
}

expectType<void>(expect(100).toBeWithinRange(90, 110));
expectType<void>(expect(101).not.toBeWithinRange(0, 100));

expectType<void>(
  expect({apples: 6, bananas: 3}).toEqual({
    apples: expect.toBeWithinRange(1, 10),
    bananas: expect.not.toBeWithinRange(11, 20),
  }),
);

// MatcherFunction

expectError(() => {
  const actualMustBeUnknown: MatcherFunction = (actual: string) => {
    return {
      message: () => `result: ${actual}`,
      pass: actual === 'result',
    };
  };
});

expectError(() => {
  const lacksMessage: MatcherFunction = (actual: unknown) => {
    return {
      pass: actual === 'result',
    };
  };
});

expectError(() => {
  const lacksPass: MatcherFunction = (actual: unknown) => {
    return {
      message: () => `result: ${actual}`,
    };
  };
});

type ToBeWithinRange = (
  this: MatcherState,
  actual: unknown,
  floor: number,
  ceiling: number,
) => ExpectationResult;

const toBeWithinRange: MatcherFunction<[floor: number, ceiling: number]> = (
  actual: unknown,
  floor: unknown,
  ceiling: unknown,
) => {
  return {
    message: () => `actual ${actual}; range ${floor}-${ceiling}`,
    pass: true,
  };
};

expectType<ToBeWithinRange>(toBeWithinRange);

type AllowOmittingExpected = (
  this: MatcherState,
  actual: unknown,
) => ExpectationResult;

const allowOmittingExpected: MatcherFunction = (actual: unknown) => {
  return {
    message: () => `actual ${actual}`,
    pass: true,
  };
};

expectType<AllowOmittingExpected>(allowOmittingExpected);

// MatcherState

const toHaveContext: MatcherFunction = function (actual: unknown) {
  expectType<MatcherState>(this);

  return {
    message: () => `result: ${actual}`,
    pass: actual === 'result',
  };
};

interface CustomContext extends MatcherState {
  customMethod(): void;
}

const customContext: MatcherFunctionWithContext<CustomContext> = function (
  actual: unknown,
) {
  expectType<CustomContext>(this);
  expectType<void>(this.customMethod());

  return {
    message: () => `result: ${actual}`,
    pass: actual === 'result',
  };
};

type CustomContextAndExpected = (
  this: CustomContext,
  actual: unknown,
  count: number,
) => ExpectationResult;

const customContextAndExpected: MatcherFunctionWithContext<
  CustomContext,
  [count: number]
> = function (actual: unknown, count: unknown) {
  expectType<CustomContext>(this);
  expectType<void>(this.customMethod());

  return {
    message: () => `count: ${count}`,
    pass: actual === count,
  };
};

expectType<CustomContextAndExpected>(customContextAndExpected);
