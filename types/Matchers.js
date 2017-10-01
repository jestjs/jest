/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path} from 'types/Config';
import type {SnapshotState} from 'jest-snapshot';

export type ExpectationResult = {
  pass: boolean,
  message: () => string,
};

export type RawMatcherFn = (
  expected: any,
  actual: any,
  options: any,
) => ExpectationResult;

export type ThrowingMatcherFn = (actual: any) => void;
export type PromiseMatcherFn = (actual: any) => Promise<void>;
export type MatcherState = {
  assertionCalls: number,
  currentTestName?: string,
  equals: (any, any) => boolean,
  expand?: boolean,
  expectedAssertionsNumber: ?number,
  isExpectingAssertions: ?boolean,
  isNot: boolean,
  snapshotState: SnapshotState,
  suppressedErrors: Array<Error>,
  testPath?: Path,
  utils: Object,
};

export type AsymmetricMatcher = Object;
export type MatchersObject = {[id: string]: RawMatcherFn};
export type Expect = {
  (expected: any): ExpectationObject,
  addSnapshotSerializer(any): void,
  assertions(number): void,
  extend(any): void,
  extractExpectedAssertionsErrors: () => Array<{
    actual: string,
    error: Error,
    expected: string,
  }>,
  getState(): MatcherState,
  hasAssertions(): void,
  setState(Object): void,

  any(expectedObject: any): AsymmetricMatcher,
  anything(): AsymmetricMatcher,
  arrayContaining(sample: Array<any>): AsymmetricMatcher,
  objectContaining(sample: Object): AsymmetricMatcher,
  stringContaining(expected: string): AsymmetricMatcher,
  stringMatching(expected: string | RegExp): AsymmetricMatcher,
};

export type ExpectationObject = {
  [id: string]: ThrowingMatcherFn,
  resolves: {
    [id: string]: PromiseMatcherFn,
    not: {[id: string]: PromiseMatcherFn},
  },
  rejects: {
    [id: string]: PromiseMatcherFn,
    not: {[id: string]: PromiseMatcherFn},
  },
  not: {[id: string]: ThrowingMatcherFn},
};
