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

import type {Config} from 'types/Config';
import type {SnapshotState} from '../jest-snapshot/src/SnapshotState';

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
export type MatchersObject = {[id:string]: RawMatcherFn};
export type Expect = (
  expected: any,
  matchersContext: MatchersContext,
) => ExpectationObject;
export type ExpectationObject = {
  [id: string]: ThrowingMatcherFn,
  not: {[id: string]: ThrowingMatcherFn},
};
export type MatchersContext = {
  config: Config,
  snapshotState: SnapshotState,
};
