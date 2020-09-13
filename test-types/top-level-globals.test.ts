/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @type ./empty.d.ts
 */

import {expectType} from 'mlh-tsd';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
  //eslint-disable-next-line import/no-extraneous-dependencies
} from '@jest/globals';

const fn = () => {};
const asyncFn = async () => {};
const timeout = 5;
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

expectType<void>(test.each(testTable)('Test name', fn));
expectType<void>(test.each(testTable)('Test name', fn, timeout));
expectType<void>(test.only.each(testTable)('Test name', fn));
expectType<void>(test.only.each(testTable)('Test name', fn, timeout));
expectType<void>(test.skip.each(testTable)('Test name', fn));
expectType<void>(test.skip.each(testTable)('Test name', fn, timeout));
expectType<void>(test.concurrent.each(testTable)('Test name', asyncFn));
expectType<void>(
  test.concurrent.each(testTable)('Test name', asyncFn, timeout),
);
expectType<void>(test.concurrent.only.each(testTable)('Test name', asyncFn));
expectType<void>(
  test.concurrent.only.each(testTable)('Test name', asyncFn, timeout),
);
expectType<void>(test.concurrent.skip.each(testTable)('Test name', asyncFn));
expectType<void>(
  test.concurrent.skip.each(testTable)('Test name', asyncFn, timeout),
);
expectType<void>(describe.each(testTable)('Test name', fn));
expectType<void>(describe.each(testTable)('Test name', fn, timeout));
expectType<void>(describe.only.each(testTable)('Test name', fn));
expectType<void>(describe.only.each(testTable)('Test name', fn, timeout));
expectType<void>(describe.skip.each(testTable)('Test name', fn));
expectType<void>(describe.skip.each(testTable)('Test name', fn, timeout));
