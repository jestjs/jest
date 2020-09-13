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
const timeout = 5;
const testTable = [[1, 2]];

// https://jestjs.io/docs/en/api#methods
expectType<void>(afterAll(fn));
expectType<void>(afterAll(fn, timeout));
expectType<void>(afterEach(fn));
expectType<void>(afterEach(fn, timeout));
expectType<void>(beforeAll(fn));
expectType<void>(beforeAll(fn, timeout));
expectType<void>(beforeEach(fn));
expectType<void>(beforeEach(fn, timeout));

expectType<Function>(test.each(testTable));
expectType<Function>(test.only.each(testTable));
expectType<Function>(test.skip.each(testTable));
expectType<Function>(test.concurrent.each(testTable));
expectType<Function>(test.concurrent.only.each(testTable));
expectType<Function>(test.concurrent.skip.each(testTable));
expectType<Function>(describe.each(testTable));
expectType<Function>(describe.only.each(testTable));
expectType<Function>(describe.skip.each(testTable));
