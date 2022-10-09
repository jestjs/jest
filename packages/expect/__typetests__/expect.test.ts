/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import type {EqualsFunction} from '@jest/expect-utils';
import {
  MatcherContext,
  MatcherFunction,
  MatcherFunctionWithContext,
  Matchers,
  Tester,
  TesterContext,
  expect,
} from 'expect';
import type {DiffOptions} from 'jest-diff';
import type * as jestMatcherUtils from 'jest-matcher-utils';

type M = Matchers<void>;
type N = Matchers<void, string>;

expectError(() => {
  type E = Matchers;
});

const tester1: Tester = function (a, b, customTesters) {
  expectType<any>(a);
  expectType<any>(b);
  expectType<Array<Tester>>(customTesters);
  expectType<TesterContext>(this);
  expectType<EqualsFunction>(this.equals);
  return undefined;
};

expectType<void>(
  expect.addEqualityTesters([
    tester1,
    (a, b, customTesters) => {
      expectType<any>(a);
      expectType<any>(b);
      expectType<Array<Tester>>(customTesters);
      expectType<undefined>(this);
      return true;
    },
    function anotherTester(a, b, customTesters) {
      expectType<any>(a);
      expectType<any>(b);
      expectType<Array<Tester>>(customTesters);
      expectType<TesterContext>(this);
      expectType<EqualsFunction>(this.equals);
      return undefined;
    },
  ]),
);

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
      expectType<Array<Tester>>(this.customTesters);
      expectType<DiffOptions | undefined>(this.diffOptions);
      expectType<() => void>(this.dontThrow);
      expectType<Error | undefined>(this.error);
      expectType<EqualsFunction>(this.equals);
      expectType<boolean | undefined>(this.expand);
      expectType<number | null>(this.expectedAssertionsNumber);
      expectType<Error | undefined>(this.expectedAssertionsNumberError);
      expectType<boolean>(this.isExpectingAssertions);
      expectType<Error | undefined>(this.isExpectingAssertionsError);
      expectType<boolean | undefined>(this.isNot);
      expectType<number>(this.numPassingAsserts);
      expectType<jestMatcherUtils.MatcherHintOptions | undefined>(
        this.matcherHintOptions,
      );
      expectType<string | undefined>(this.promise);
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
  this: MatcherContext,
  actual: unknown,
  floor: number,
  ceiling: number,
) => any;

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

expectAssignable<ToBeWithinRange>(toBeWithinRange);

type AllowOmittingExpected = (this: MatcherContext, actual: unknown) => any;

const allowOmittingExpected: MatcherFunction = (
  actual: unknown,
  ...expect: Array<unknown>
) => {
  if (expect.length !== 0) {
    throw new Error('This matcher does not take any expected argument.');
  }

  return {
    message: () => `actual ${actual}`,
    pass: true,
  };
};

expectAssignable<AllowOmittingExpected>(allowOmittingExpected);

// MatcherContext

const toHaveContext: MatcherFunction = function (
  actual: unknown,
  ...expect: Array<unknown>
) {
  expectType<MatcherContext>(this);

  if (expect.length !== 0) {
    throw new Error('This matcher does not take any expected argument.');
  }

  return {
    message: () => `result: ${actual}`,
    pass: actual === 'result',
  };
};

interface CustomContext extends MatcherContext {
  customMethod(): void;
}

const customContext: MatcherFunctionWithContext<CustomContext> = function (
  actual: unknown,
  ...expect: Array<unknown>
) {
  expectType<CustomContext>(this);
  expectType<void>(this.customMethod());

  if (expect.length !== 0) {
    throw new Error('This matcher does not take any expected argument.');
  }

  return {
    message: () => `result: ${actual}`,
    pass: actual === 'result',
  };
};

type CustomStateAndExpected = (
  this: CustomContext,
  actual: unknown,
  count: number,
) => any;

const customStateAndExpected: MatcherFunctionWithContext<
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

expectAssignable<CustomStateAndExpected>(customStateAndExpected);

expectError(() => {
  expect({}).toMatchSnapshot();
});
