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

export type ExpectationResult = {
  pass: boolean,
  message: string | () => string,
};

export type RawMatcherFn = (expected?: any, actual: any) => ExpectationResult;
export type ThrowingMatcherFn = (actual: any) => void;
export type MatchersObject = {[id:string]: RawMatcherFn};
