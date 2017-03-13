/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Path} from 'types/Config';

export type ExpectationResult = {
  pass: boolean,
  message: string | () => string,
};

export type RawMatcherFn = (
  expected: any,
  actual: any,
  options: any,
) => ExpectationResult;

export type ThrowingMatcherFn = (actual: any) => void;
export type PromiseMatcherFn = (actual: any) => Promise<void>;
export type MatcherContext = {isNot: boolean};
export type MatcherState = {
  assertionCalls?: number,
  assertionsExpected?: ?number,
  currentTestName?: string,
  testPath?: Path,
};
export type MatchersObject = {[id:string]: RawMatcherFn};
export type Expect = (expected: any) => ExpectationObject;
export type ExpectationObject = {
  resolves: {
    [id: string]: PromiseMatcherFn,
    not: {[id: string]: PromiseMatcherFn},
  },
  rejects: {
    [id: string]: PromiseMatcherFn,
    not: {[id: string]: PromiseMatcherFn},
  },
  [id: string]: ThrowingMatcherFn,
  not: {[id: string]: ThrowingMatcherFn},
};
