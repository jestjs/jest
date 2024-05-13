/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import type {EqualsFunction} from '@jest/expect-utils';
import {
  type MatcherContext,
  type MatcherFunction,
  type MatcherFunctionWithContext,
  type Matchers,
  type Tester,
  type TesterContext,
  expect as jestExpect,
} from 'expect';
import type * as jestMatcherUtils from 'jest-matcher-utils';

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
}

describe('Matchers', () => {
  test('requires between 1 and 2 type arguments', () => {
    expect<Matchers<void, string>>().type.not.toRaiseError();
    expect<Matchers<void>>().type.not.toRaiseError();

    expect<Matchers>().type.toRaiseError(
      'requires between 1 and 2 type arguments',
    );
  });
});

describe('Expect', () => {
  test('.addEqualityTesters()', () => {
    const tester1: Tester = function (a, b, customTesters) {
      expect(a).type.toBeAny();
      expect(b).type.toBeAny();
      expect(customTesters).type.toEqual<Array<Tester>>();
      expect(this).type.toEqual<TesterContext>();
      expect(this.equals).type.toEqual<EqualsFunction>();

      return undefined;
    };

    expect(
      jestExpect.addEqualityTesters([
        tester1,

        (a, b, customTesters) => {
          expect(a).type.toBeAny();
          expect(b).type.toBeAny();
          expect(customTesters).type.toEqual<Array<Tester>>();
          expect(this).type.toBeUndefined();

          return true;
        },

        function anotherTester(a, b, customTesters) {
          expect(a).type.toBeAny();
          expect(b).type.toBeAny();
          expect(customTesters).type.toEqual<Array<Tester>>();
          expect(this).type.toEqual<TesterContext>();
          expect(this.equals).type.toEqual<EqualsFunction>();

          return undefined;
        },
      ]),
    ).type.toBeVoid();
  });

  test('.extend()', () => {
    type MatcherUtils = typeof jestMatcherUtils & {
      iterableEquality: Tester;
      subsetEquality: Tester;
    };

    expect(
      jestExpect.extend({
        // TODO `actual` should be allowed to have only `unknown` type
        toBeWithinRange(actual: number, floor: number, ceiling: number) {
          expect(this.assertionCalls).type.toBeNumber();
          expect(this.currentTestName).type.toEqual<string | undefined>();
          expect(this.customTesters).type.toEqual<Array<Tester>>();
          expect(this.dontThrow).type.toEqual<() => void>();
          expect(this.error).type.toEqual<Error | undefined>();
          expect(this.equals).type.toEqual<EqualsFunction>();
          expect(this.expand).type.toEqual<boolean | undefined>();
          expect(this.expectedAssertionsNumber).type.toEqual<number | null>();
          expect(this.expectedAssertionsNumberError).type.toEqual<
            Error | undefined
          >();
          expect(this.isExpectingAssertions).type.toBeBoolean();
          expect(this.isExpectingAssertionsError).type.toEqual<
            Error | undefined
          >();
          expect(this.isNot).type.toEqual<boolean | undefined>();
          expect(this.numPassingAsserts).type.toBeNumber();
          expect(this.promise).type.toEqual<string | undefined>();
          expect(this.suppressedErrors).type.toEqual<Array<Error>>();
          expect(this.testPath).type.toEqual<string | undefined>();
          expect(this.utils).type.toEqual<MatcherUtils>();

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
    ).type.toBeVoid();

    expect(jestExpect(100).toBeWithinRange(90, 110)).type.toBeVoid();
    expect(jestExpect(101).not.toBeWithinRange(0, 100)).type.toBeVoid();

    expect(
      jestExpect({apples: 6, bananas: 3}).toEqual({
        apples: jestExpect.toBeWithinRange(1, 10),
        bananas: jestExpect.not.toBeWithinRange(11, 20),
      }),
    ).type.toBeVoid();
  });

  test('does not define the `.toMatchSnapshot()` matcher', () => {
    expect(jestExpect(null)).type.not.toHaveProperty('toMatchSnapshot');
  });
});

describe('MatcherFunction', () => {
  test('models typings of a matcher function', () => {
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

    expect<ToBeWithinRange>().type.toBeAssignable(toBeWithinRange);
  });

  test('requires the `actual` argument to be of type `unknown`', () => {
    const actualMustBeUnknown = (actual: string) => {
      return {
        message: () => `result: ${actual}`,
        pass: actual === 'result',
      };
    };

    expect<MatcherFunction>().type.not.toBeAssignable(actualMustBeUnknown);
  });

  test('allows omitting the `expected` argument', () => {
    type AllowOmittingExpected = (this: MatcherContext, actual: unknown) => any;

    const allowOmittingExpected: MatcherFunction = (
      actual: unknown,
      ...expected: Array<unknown>
    ) => {
      if (expected.length > 0) {
        throw new Error('This matcher does not take any expected argument.');
      }

      return {
        message: () => `actual ${actual}`,
        pass: true,
      };
    };

    expect<AllowOmittingExpected>().type.toBeAssignable(allowOmittingExpected);
  });

  test('the `message` property is required in the return type', () => {
    const lacksMessage = (actual: unknown) => {
      return {
        pass: actual === 'result',
      };
    };

    expect<MatcherFunction>().type.not.toBeAssignable(lacksMessage);
  });

  test('the `pass` property is required in the return type', () => {
    const lacksPass = (actual: unknown) => {
      return {
        message: () => `result: ${actual}`,
      };
    };

    expect<MatcherFunction>().type.not.toBeAssignable(lacksPass);
  });

  test('context is defined inside a matcher function', () => {
    const toHaveContext: MatcherFunction = function (
      actual: unknown,
      ...expected: Array<unknown>
    ) {
      expect(this).type.toEqual<MatcherContext>();

      if (expected.length > 0) {
        throw new Error('This matcher does not take any expected argument.');
      }

      return {
        message: () => `result: ${actual}`,
        pass: actual === 'result',
      };
    };
  });

  test('context can be customized', () => {
    interface CustomContext extends MatcherContext {
      customMethod(): void;
    }

    const customContext: MatcherFunctionWithContext<CustomContext> = function (
      actual: unknown,
      ...expected: Array<unknown>
    ) {
      expect(this).type.toEqual<CustomContext>();
      expect(this.customMethod()).type.toBeVoid();

      if (expected.length > 0) {
        throw new Error('This matcher does not take any expected argument.');
      }

      return {
        message: () => `result: ${actual}`,
        pass: actual === 'result',
      };
    };
  });

  test('context and type of `expected` can be customized', () => {
    interface CustomContext extends MatcherContext {
      customMethod(): void;
    }

    type CustomStateAndExpected = (
      this: CustomContext,
      actual: unknown,
      count: number,
    ) => any;

    const customContextAndExpected: MatcherFunctionWithContext<
      CustomContext,
      [count: number]
    > = function (actual: unknown, count: unknown) {
      expect(this).type.toEqual<CustomContext>();
      expect(this.customMethod()).type.toBeVoid();

      return {
        message: () => `count: ${count}`,
        pass: actual === count,
      };
    };

    expect<CustomStateAndExpected>().type.toBeAssignable(
      customContextAndExpected,
    );
  });
});
