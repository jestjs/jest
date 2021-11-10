/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'mlh-tsd';
import * as expect from 'expect';
import type * as jestMatcherUtils from 'jest-matcher-utils';

export type M = expect.Matchers<void, unknown>;
export type N = expect.Matchers<void>;
// @ts-expect-error
export type E = expect.Matchers<>;

// extend

type Tester = (a: any, b: any) => boolean | undefined;

type MatcherUtils = typeof jestMatcherUtils & {
  iterableEquality: Tester;
  subsetEquality: Tester;
};

expectType<void>(
  expect.extend({
    toBeWithinRange(actual: number, floor: number, ceiling: number) {
      expectType<number>(this.assertionCalls);
      expectType<string | undefined>(this.currentTestName);
      expectType<(() => void) | undefined>(this.dontThrow);
      expectType<Error | undefined>(this.error);
      expectType<
        (
          a: unknown,
          b: unknown,
          customTesters?: Array<Tester>,
          strictCheck?: boolean,
        ) => boolean
      >(this.equals);
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

      // `snapshotState` type should not leak from `@jest/types`

      expectError(this.snapshotState);

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

declare module '@jest/types' {
  namespace Expect {
    interface AsymmetricMatchers {
      toBeWithinRange(floor: number, ceiling: number): AsymmetricMatcher;
    }
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
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

// `addSnapshotSerializer` type should not leak from `@jest/types`

expectError(expect.addSnapshotSerializer());

// snapshot matchers types should not leak from `@jest/types`

expectError(expect({a: 1}).toMatchSnapshot());
expectError(expect('abc').toMatchInlineSnapshot());

expectError(expect(jest.fn()).toThrowErrorMatchingSnapshot());
expectError(expect(jest.fn()).toThrowErrorMatchingInlineSnapshot());
