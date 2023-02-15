/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
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
const asyncFn = async () => {};
const genFn = function* () {};

const table = [
  [1, 2, 3],
  [4, 5, 6],
];

const testName = 'Test name';
const timeout = 5;

// done

test(testName, done => {
  done();
});

test(testName, done => {
  done('error message');
});

test(testName, done => {
  done(new Error('message'));
});

test(testName, done => {
  expectType<Global.DoneFn>(done);
});

test(testName, done => {
  expectError(done(123));
});

// beforeAll

expectType<void>(beforeAll(fn));
expectType<void>(beforeAll(asyncFn));
expectType<void>(beforeAll(genFn));
expectType<void>(
  beforeAll(done => {
    expectType<Global.DoneFn>(done);
  }),
);

expectType<void>(beforeAll(fn, timeout));
expectType<void>(beforeAll(asyncFn, timeout));
expectType<void>(beforeAll(genFn, timeout));
expectType<void>(
  beforeAll(done => {
    expectType<Global.DoneFn>(done);
  }, timeout),
);

expectError(beforeAll());
expectError(beforeAll('abc'));

expectError(
  beforeAll(async done => {
    done();
  }),
);
expectError(
  beforeAll(function* (done) {
    done();
  }),
);

// beforeEach

expectType<void>(beforeEach(fn));
expectType<void>(beforeEach(asyncFn));
expectType<void>(beforeEach(genFn));
expectType<void>(
  beforeEach(done => {
    expectType<Global.DoneFn>(done);
  }),
);

expectType<void>(beforeEach(fn, timeout));
expectType<void>(beforeEach(asyncFn, timeout));
expectType<void>(beforeEach(genFn, timeout));
expectType<void>(
  beforeEach(done => {
    expectType<Global.DoneFn>(done);
  }, timeout),
);

expectError(beforeEach());
expectError(beforeEach('abc'));

expectError(
  beforeEach(async done => {
    done();
  }),
);
expectError(
  beforeEach(function* (done) {
    done();
  }),
);

// afterAll

expectType<void>(afterAll(fn));
expectType<void>(afterAll(asyncFn));
expectType<void>(afterAll(genFn));
expectType<void>(
  afterAll(done => {
    expectType<Global.DoneFn>(done);
  }),
);

expectType<void>(afterAll(fn, timeout));
expectType<void>(afterAll(asyncFn, timeout));
expectType<void>(afterAll(genFn, timeout));
expectType<void>(
  afterAll(done => {
    expectType<Global.DoneFn>(done);
  }, timeout),
);

expectError(afterAll());
expectError(afterAll('abc'));

expectError(
  afterAll(async done => {
    done();
  }),
);
expectError(
  afterAll(function* (done) {
    done();
  }),
);

// afterEach

expectType<void>(afterEach(fn));
expectType<void>(afterEach(asyncFn));
expectType<void>(afterEach(genFn));
expectType<void>(
  afterEach(done => {
    expectType<Global.DoneFn>(done);
  }),
);

expectType<void>(afterEach(fn, timeout));
expectType<void>(afterEach(asyncFn, timeout));
expectType<void>(afterEach(genFn, timeout));
expectType<void>(
  afterEach(done => {
    expectType<Global.DoneFn>(done);
  }, timeout),
);

expectError(afterEach());
expectError(afterEach('abc'));

expectError(
  afterEach(async done => {
    done();
  }),
);
expectError(
  afterEach(function* (done) {
    done();
  }),
);

// test

expectType<void>(test(testName, fn));
expectType<void>(test(testName, asyncFn));
expectType<void>(test(testName, genFn));
expectType<void>(
  test(testName, done => {
    expectType<Global.DoneFn>(done);
  }),
);

expectType<void>(test(testName, fn, timeout));
expectType<void>(test(testName, asyncFn, timeout));
expectType<void>(test(testName, genFn, timeout));
expectType<void>(
  test(
    testName,
    done => {
      expectType<Global.DoneFn>(done);
    },
    timeout,
  ),
);

expectType<void>(test(123, fn));
expectType<void>(test(() => {}, fn));
expectType<void>(test(function named() {}, fn));
expectType<void>(test(class {}, fn));
expectType<void>(test(class Named {}, fn));

expectError(test());
expectError(test(testName));
expectError(test(testName, timeout));
expectError(test(testName, () => 42));

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

// test.concurrent

expectType<void>(test.concurrent(testName, asyncFn));
expectType<void>(test.concurrent(testName, asyncFn, timeout));

expectType<void>(test.concurrent(123, asyncFn));
expectType<void>(test.concurrent(() => {}, asyncFn));
expectType<void>(test.concurrent(function named() {}, asyncFn));
expectType<void>(test.concurrent(class {}, asyncFn));
expectType<void>(test.concurrent(class Named {}, asyncFn));

expectError(test.concurrent(testName, fn));

// test.concurrent.each

expectType<void>(test.concurrent.each(table)(testName, asyncFn));
expectType<void>(test.concurrent.each(table)(testName, asyncFn, timeout));

expectType<void>(test.concurrent.each(table)(123, asyncFn));
expectType<void>(test.concurrent.each(table)(() => {}, asyncFn));
expectType<void>(test.concurrent.each(table)(function named() {}, asyncFn));
expectType<void>(test.concurrent.each(table)(class {}, asyncFn));
expectType<void>(test.concurrent.each(table)(class Named {}, asyncFn));

expectError(test.concurrent.each(table)(testName, fn));

// test.concurrent.failing

expectType<void>(test.concurrent.failing(testName, asyncFn));
expectType<void>(test.concurrent.failing(testName, asyncFn, timeout));

expectType<void>(test.concurrent.failing(123, asyncFn));
expectType<void>(test.concurrent.failing(() => {}, asyncFn));
expectType<void>(test.concurrent.failing(function named() {}, asyncFn));
expectType<void>(test.concurrent.failing(class {}, asyncFn));
expectType<void>(test.concurrent.failing(class Named {}, asyncFn));

expectType<typeof test.concurrent.each>(test.concurrent.failing.each);

expectError(test.concurrent.failing(testName, fn));

// test.concurrent.only

expectType<typeof test.concurrent.each>(test.concurrent.only.each);
expectType<typeof test.concurrent.failing>(test.concurrent.only.failing);
expectType<typeof test.concurrent.each>(test.concurrent.only.failing.each);

// test.concurrent.skip

expectType<typeof test.concurrent.each>(test.concurrent.skip.each);
expectType<typeof test.concurrent.failing>(test.concurrent.skip.failing);
expectType<typeof test.concurrent.each>(test.concurrent.skip.failing.each);

// test.each

expectType<void>(test.each(table)(testName, fn));
expectType<void>(test.each(table)(testName, fn, timeout));

expectType<void>(test.each(table)(123, fn));
expectType<void>(test.each(table)(() => {}, fn));
expectType<void>(test.each(table)(function named() {}, fn));
expectType<void>(test.each(table)(class {}, fn));
expectType<void>(test.each(table)(class Named {}, fn));

// test.failing

expectType<void>(test.failing(testName, fn));
expectType<void>(test.failing(testName, fn, timeout));

expectType<void>(test.failing(123, fn));
expectType<void>(test.failing(() => {}, fn));
expectType<void>(test.failing(function named() {}, fn));
expectType<void>(test.failing(class {}, fn));
expectType<void>(test.failing(class Named {}, fn));

expectType<typeof test.each>(test.failing.each);

// test.only

expectType<void>(test.only(testName, fn));
expectType<void>(test.only(testName, fn, timeout));

expectType<void>(test.only(123, fn));
expectType<void>(test.only(() => {}, fn));
expectType<void>(test.only(function named() {}, fn));
expectType<void>(test.only(class {}, fn));
expectType<void>(test.only(class Named {}, fn));

expectType<typeof test.each>(test.only.each);
expectType<typeof test.failing>(test.only.failing);
expectType<typeof test.each>(test.only.failing.each);

// test.skip

expectType<void>(test.skip(testName, fn));
expectType<void>(test.skip(testName, fn, timeout));

expectType<void>(test.skip(123, fn));
expectType<void>(test.skip(() => {}, fn));
expectType<void>(test.skip(function named() {}, fn));
expectType<void>(test.skip(class {}, fn));
expectType<void>(test.skip(class Named {}, fn));

expectType<typeof test.each>(test.skip.each);
expectType<typeof test.failing>(test.skip.failing);
expectType<typeof test.each>(test.skip.failing.each);

// test.todo

expectType<void>(test.todo(testName));

expectType<void>(test.todo(123));
expectType<void>(test.todo(() => {}));
expectType<void>(test.todo(function named() {}));
expectType<void>(test.todo(class {}));
expectType<void>(test.todo(class Named {}));

expectError(test.todo());
expectError(test.todo(testName, fn));

// describe

expectType<void>(describe(testName, fn));

expectError(describe());
expectError(describe(fn));
expectError(describe(testName, fn, timeout));

expectType<void>(describe(123, fn));
expectType<void>(describe(() => {}, fn));
expectType<void>(describe(function named() {}, fn));
expectType<void>(describe(class {}, fn));
expectType<void>(describe(class Named {}, fn));

expectType<void>(describe.each(table)(testName, fn));
expectType<void>(describe.each(table)(testName, fn, timeout));

expectType<void>(describe.each(table)(testName, fn));
expectType<void>(describe.each(table)(123, fn));
expectType<void>(describe.each(table)(() => {}, fn));
expectType<void>(describe.each(table)(function named() {}, fn));
expectType<void>(describe.each(table)(class Named {}, fn));

// describe.only

expectType<void>(describe.only(testName, fn));

expectError(describe.only());
expectError(describe.only(fn));
expectError(describe.only(testName, fn, timeout));

expectType<void>(describe.only(123, fn));
expectType<void>(describe.only(() => {}, fn));
expectType<void>(describe.only(function named() {}, fn));
expectType<void>(describe.only(class {}, fn));
expectType<void>(describe.only(class Named {}, fn));

expectType<typeof describe.each>(describe.only.each);

// describe.skip

expectType<void>(describe.skip(testName, fn));

expectError(describe.skip());
expectError(describe.skip(fn));
expectError(describe.skip(testName, fn, timeout));

expectType<void>(describe.skip(123, fn));
expectType<void>(describe.skip(() => {}, fn));
expectType<void>(describe.skip(function named() {}, fn));
expectType<void>(describe.skip(class {}, fn));
expectType<void>(describe.skip(class Named {}, fn));

expectType<typeof describe.each>(describe.skip.each);
