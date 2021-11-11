/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'mlh-tsd';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from '@jest/globals';
import type {Global} from '@jest/types';

const fn = () => {};
const doneFn: Global.DoneTakingTestFn = done => {
  done();
};
const asyncFn = async () => {};
const genFn = function* () {};
const timeout = 5;
const testName = 'Test name';
const testTable = [[1, 2]];

// https://jestjs.io/docs/api#methods
expectType<void>(afterAll(fn));
expectType<void>(afterAll(asyncFn));
expectType<void>(afterAll(genFn));
expectType<void>(afterAll(fn, timeout));
expectType<void>(afterAll(asyncFn, timeout));
expectType<void>(afterAll(genFn, timeout));
expectType<void>(afterEach(fn));
expectType<void>(afterEach(asyncFn));
expectType<void>(afterEach(genFn));
expectType<void>(afterEach(fn, timeout));
expectType<void>(afterEach(asyncFn, timeout));
expectType<void>(afterEach(genFn, timeout));
expectType<void>(beforeAll(fn));
expectType<void>(beforeAll(asyncFn));
expectType<void>(beforeAll(genFn));
expectType<void>(beforeAll(fn, timeout));
expectType<void>(beforeAll(asyncFn, timeout));
expectType<void>(beforeAll(genFn, timeout));
expectType<void>(beforeEach(fn));
expectType<void>(beforeEach(asyncFn));
expectType<void>(beforeEach(genFn));
expectType<void>(beforeEach(fn, timeout));
expectType<void>(beforeEach(asyncFn, timeout));
expectType<void>(beforeEach(genFn, timeout));

expectType<void>(test(testName, fn));
expectType<void>(test(testName, asyncFn));
expectType<void>(test(testName, doneFn));
expectType<void>(test(testName, genFn));
expectType<void>(test(testName, fn, timeout));
expectType<void>(test(testName, asyncFn, timeout));
expectType<void>(test(testName, doneFn, timeout));
expectType<void>(test(testName, genFn, timeout));

// wrong arguments
expectError(test(testName));
expectError(test(testName, timeout));
expectError(test(timeout, fn));

// wrong return value
expectError(test(testName, () => 42));

// mixing done callback and promise/generator
expectError(
  test(testName, async done => {
    done();
  }),
);
expectError(
  test(testName, function* (done) {
    done();
  }),
);

expectType<void>(test(testName, fn));
expectType<void>(test(testName, asyncFn));
expectType<void>(test(testName, genFn));
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
