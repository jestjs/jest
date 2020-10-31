/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @type ./empty.d.ts
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from '@jest/globals';
import {expectType} from 'mlh-tsd';

const fn = () => {};
const asyncFn = async () => {};
const timeout = 5;
const testName = 'Test name';
const testTable = [[1, 2]];

// https://jestjs.io/docs/en/api#methods
expectType<void>(afterAll(fn));
expectType<void>(afterAll(asyncFn));
expectType<void>(afterAll(fn, timeout));
expectType<void>(afterEach(fn));
expectType<void>(afterEach(asyncFn));
expectType<void>(afterEach(fn, timeout));
expectType<void>(beforeAll(fn));
expectType<void>(beforeAll(asyncFn));
expectType<void>(beforeAll(fn, timeout));
expectType<void>(beforeEach(fn));
expectType<void>(beforeEach(asyncFn));
expectType<void>(beforeEach(fn, timeout));

expectType<void>(test.each(testTable)(testName, fn));
expectType<void>(test.each(testTable)(testName, fn, timeout));
expectType<void>(test.only.each(testTable)(testName, fn));
expectType<void>(test.only.each(testTable)(testName, fn, timeout));
expectType<void>(test.skip.each(testTable)(testName, fn));
expectType<void>(test.skip.each(testTable)(testName, fn, timeout));
expectType<void>(test.concurrent.each(testTable)(testName, asyncFn));
expectType<void>(test.concurrent.each(testTable)(testName, asyncFn, timeout));
expectType<void>(test.concurrent.only.each(testTable)(testName, asyncFn));
expectType<void>(
  test.concurrent.only.each(testTable)(testName, asyncFn, timeout),
);
expectType<void>(test.concurrent.skip.each(testTable)(testName, asyncFn));
expectType<void>(
  test.concurrent.skip.each(testTable)(testName, asyncFn, timeout),
);
expectType<void>(describe.each(testTable)(testName, fn));
expectType<void>(describe.each(testTable)(testName, fn, timeout));
expectType<void>(describe.only.each(testTable)(testName, fn));
expectType<void>(describe.only.each(testTable)(testName, fn, timeout));
expectType<void>(describe.skip.each(testTable)(testName, fn));
expectType<void>(describe.skip.each(testTable)(testName, fn, timeout));
