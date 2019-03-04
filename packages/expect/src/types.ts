/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {Config} from '@jest/types';
import * as jestMatcherUtils from 'jest-matcher-utils';

export type SyncExpectationResult = {
  pass: boolean;
  message: () => string;
};

export type AsyncExpectationResult = Promise<SyncExpectationResult>;

export type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;

export type RawMatcherFn = (
  expected: any,
  actual: any,
  options?: any,
) => ExpectationResult;

export type ThrowingMatcherFn = (actual: any) => void;
export type PromiseMatcherFn = (actual: any) => Promise<void>;

export type Tester = (a: any, b: any) => boolean | undefined;

export type MatcherState = {
  assertionCalls: number;
  currentTestName?: string;
  dontThrow?: () => void;
  error?: Error;
  equals: (
    a: unknown,
    b: unknown,
    customTesters?: Array<Tester>,
    strictCheck?: boolean,
  ) => boolean;
  expand?: boolean;
  expectedAssertionsNumber?: number;
  isExpectingAssertions?: boolean;
  isNot: boolean;
  promise: string;
  suppressedErrors: Array<Error>;
  testPath?: Config.Path;
  utils: typeof jestMatcherUtils & {
    iterableEquality: Tester;
    subsetEquality: Tester;
  };
};

export type AsymmetricMatcher = Object;
export type MatchersObject = {[id: string]: RawMatcherFn};
export type Expect = {
  (expected: any): ExpectationObject;
  addSnapshotSerializer(arg0: any): void;
  assertions(arg0: number): void;
  extend(arg0: any): void;
  extractExpectedAssertionsErrors: () => Array<{
    actual: string | number;
    error: Error;
    expected: string;
  }>;
  getState(): MatcherState;
  hasAssertions(): void;
  setState(arg0: any): void;

  any(expectedObject: any): AsymmetricMatcher;
  anything(): AsymmetricMatcher;
  arrayContaining(sample: Array<any>): AsymmetricMatcher;
  objectContaining(sample: Object): AsymmetricMatcher;
  stringContaining(expected: string): AsymmetricMatcher;
  stringMatching(expected: string | RegExp): AsymmetricMatcher;
  [id: string]: AsymmetricMatcher;
  not: {[id: string]: AsymmetricMatcher};
};

type resolvesFn = {
  [id: string]: PromiseMatcherFn;
} & {
  not: {[id: string]: PromiseMatcherFn};
};

type rejectsFn = {
  [id: string]: PromiseMatcherFn;
} & {
  not: {[id: string]: PromiseMatcherFn};
};

type notFn = {
  [id: string]: ThrowingMatcherFn;
};

export type ExpectationObject = {
  [id: string]: ThrowingMatcherFn;
} & {
  resolves: resolvesFn;
  rejects: rejectsFn;
  not: notFn;
};
