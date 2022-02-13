/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import type {EqualsFunction, Tester} from '@jest/expect-utils';
import {type Matchers, expect} from 'expect';
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
