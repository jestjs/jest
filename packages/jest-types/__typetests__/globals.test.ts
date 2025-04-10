/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
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
  expect(done).type.toBe<Global.DoneFn>();
});

test(testName, done => {
  expect(done(123)).type.toRaiseError();
});

// beforeAll

expect(beforeAll(fn)).type.toBe<void>();
expect(beforeAll(asyncFn)).type.toBe<void>();
expect(beforeAll(genFn)).type.toBe<void>();
expect(
  beforeAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBe<void>();

expect(beforeAll(fn, timeout)).type.toBe<void>();
expect(beforeAll(asyncFn, timeout)).type.toBe<void>();
expect(beforeAll(genFn, timeout)).type.toBe<void>();
expect(
  beforeAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBe<void>();

expect(beforeAll()).type.toRaiseError();
expect(beforeAll('abc')).type.toRaiseError();

expect(
  beforeAll(async done => {
    done();
  }),
).type.toRaiseError();
expect(
  beforeAll(function* (done) {
    done();
  }),
).type.toRaiseError();

// beforeEach

expect(beforeEach(fn)).type.toBe<void>();
expect(beforeEach(asyncFn)).type.toBe<void>();
expect(beforeEach(genFn)).type.toBe<void>();
expect(
  beforeEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBe<void>();

expect(beforeEach(fn, timeout)).type.toBe<void>();
expect(beforeEach(asyncFn, timeout)).type.toBe<void>();
expect(beforeEach(genFn, timeout)).type.toBe<void>();
expect(
  beforeEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBe<void>();

expect(beforeEach()).type.toRaiseError();
expect(beforeEach('abc')).type.toRaiseError();

expect(
  beforeEach(async done => {
    done();
  }),
).type.toRaiseError();
expect(
  beforeEach(function* (done) {
    done();
  }),
).type.toRaiseError();

// afterAll

expect(afterAll(fn)).type.toBe<void>();
expect(afterAll(asyncFn)).type.toBe<void>();
expect(afterAll(genFn)).type.toBe<void>();
expect(
  afterAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBe<void>();

expect(afterAll(fn, timeout)).type.toBe<void>();
expect(afterAll(asyncFn, timeout)).type.toBe<void>();
expect(afterAll(genFn, timeout)).type.toBe<void>();
expect(
  afterAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBe<void>();

expect(afterAll()).type.toRaiseError();
expect(afterAll('abc')).type.toRaiseError();

expect(
  afterAll(async done => {
    done();
  }),
).type.toRaiseError();
expect(
  afterAll(function* (done) {
    done();
  }),
).type.toRaiseError();

// afterEach

expect(afterEach(fn)).type.toBe<void>();
expect(afterEach(asyncFn)).type.toBe<void>();
expect(afterEach(genFn)).type.toBe<void>();
expect(
  afterEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBe<void>();

expect(afterEach(fn, timeout)).type.toBe<void>();
expect(afterEach(asyncFn, timeout)).type.toBe<void>();
expect(afterEach(genFn, timeout)).type.toBe<void>();
expect(
  afterEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBe<void>();

expect(afterEach()).type.toRaiseError();
expect(afterEach('abc')).type.toRaiseError();

expect(
  afterEach(async done => {
    done();
  }),
).type.toRaiseError();
expect(
  afterEach(function* (done) {
    done();
  }),
).type.toRaiseError();

// test

expect(test(testName, fn)).type.toBe<void>();
expect(test(testName, asyncFn)).type.toBe<void>();
expect(test(testName, genFn)).type.toBe<void>();
expect(
  test(testName, done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBe<void>();

expect(test(testName, fn, timeout)).type.toBe<void>();
expect(test(testName, asyncFn, timeout)).type.toBe<void>();
expect(test(testName, genFn, timeout)).type.toBe<void>();
expect(
  test(
    testName,
    done => {
      expect(done).type.toBe<Global.DoneFn>();
    },
    timeout,
  ),
).type.toBe<void>();

expect(test(123, fn)).type.toBe<void>();
expect(test(() => {}, fn)).type.toBe<void>();
expect(test(function named() {}, fn)).type.toBe<void>();
expect(test(class {}, fn)).type.toBe<void>();
expect(test(class Named {}, fn)).type.toBe<void>();

expect(test()).type.toRaiseError();
expect(test(testName)).type.toRaiseError();
expect(test(testName, timeout)).type.toRaiseError();
expect(test(testName, () => 42)).type.toRaiseError();

expect(
  test(testName, async done => {
    done();
  }),
).type.toRaiseError();
expect(
  test(testName, function* (done) {
    done();
  }),
).type.toRaiseError();

// test.concurrent

expect(test.concurrent(testName, asyncFn)).type.toBe<void>();
expect(test.concurrent(testName, asyncFn, timeout)).type.toBe<void>();

expect(test.concurrent(123, asyncFn)).type.toBe<void>();
expect(test.concurrent(() => {}, asyncFn)).type.toBe<void>();
expect(test.concurrent(function named() {}, asyncFn)).type.toBe<void>();
expect(test.concurrent(class {}, asyncFn)).type.toBe<void>();
expect(test.concurrent(class Named {}, asyncFn)).type.toBe<void>();

expect(test.concurrent(testName, fn)).type.toRaiseError();

// test.concurrent.each

expect(test.concurrent.each(table)(testName, asyncFn)).type.toBe<void>();
expect(
  test.concurrent.each(table)(testName, asyncFn, timeout),
).type.toBe<void>();

expect(test.concurrent.each(table)(123, asyncFn)).type.toBe<void>();
expect(test.concurrent.each(table)(() => {}, asyncFn)).type.toBe<void>();
expect(
  test.concurrent.each(table)(function named() {}, asyncFn),
).type.toBe<void>();
expect(test.concurrent.each(table)(class {}, asyncFn)).type.toBe<void>();
expect(test.concurrent.each(table)(class Named {}, asyncFn)).type.toBe<void>();

expect(test.concurrent.each(table)(testName, fn)).type.toRaiseError();

// test.concurrent.failing

expect(test.concurrent.failing(testName, asyncFn)).type.toBe<void>();
expect(test.concurrent.failing(testName, asyncFn, timeout)).type.toBe<void>();

expect(test.concurrent.failing(123, asyncFn)).type.toBe<void>();
expect(test.concurrent.failing(() => {}, asyncFn)).type.toBe<void>();
expect(test.concurrent.failing(function named() {}, asyncFn)).type.toBe<void>();
expect(test.concurrent.failing(class {}, asyncFn)).type.toBe<void>();
expect(test.concurrent.failing(class Named {}, asyncFn)).type.toBe<void>();

expect(test.concurrent.failing.each).type.toBe(test.concurrent.each);

expect(test.concurrent.failing(testName, fn)).type.toRaiseError();

// test.concurrent.only

expect(test.concurrent.only.each).type.toBe(test.concurrent.each);
expect(test.concurrent.only.failing).type.toBe(test.concurrent.failing);
expect(test.concurrent.only.failing.each).type.toBe(test.concurrent.each);

// test.concurrent.skip

expect(test.concurrent.skip.each).type.toBe(test.concurrent.each);
expect(test.concurrent.skip.failing).type.toBe(test.concurrent.failing);
expect(test.concurrent.skip.failing.each).type.toBe(test.concurrent.each);

// test.each

expect(test.each(table)(testName, fn)).type.toBe<void>();
expect(test.each(table)(testName, fn, timeout)).type.toBe<void>();

expect(test.each(table)(123, fn)).type.toBe<void>();
expect(test.each(table)(() => {}, fn)).type.toBe<void>();
expect(test.each(table)(function named() {}, fn)).type.toBe<void>();
expect(test.each(table)(class {}, fn)).type.toBe<void>();
expect(test.each(table)(class Named {}, fn)).type.toBe<void>();

// test.failing

expect(test.failing(testName, fn)).type.toBe<void>();
expect(test.failing(testName, fn, timeout)).type.toBe<void>();

expect(test.failing(123, fn)).type.toBe<void>();
expect(test.failing(() => {}, fn)).type.toBe<void>();
expect(test.failing(function named() {}, fn)).type.toBe<void>();
expect(test.failing(class {}, fn)).type.toBe<void>();
expect(test.failing(class Named {}, fn)).type.toBe<void>();

expect(test.failing.each).type.toBe(test.each);

// test.only

expect(test.only(testName, fn)).type.toBe<void>();
expect(test.only(testName, fn, timeout)).type.toBe<void>();

expect(test.only(123, fn)).type.toBe<void>();
expect(test.only(() => {}, fn)).type.toBe<void>();
expect(test.only(function named() {}, fn)).type.toBe<void>();
expect(test.only(class {}, fn)).type.toBe<void>();
expect(test.only(class Named {}, fn)).type.toBe<void>();

expect(test.only.each).type.toBe(test.each);
expect(test.only.failing).type.toBe(test.failing);
expect(test.only.failing.each).type.toBe(test.each);

// test.skip

expect(test.skip(testName, fn)).type.toBe<void>();
expect(test.skip(testName, fn, timeout)).type.toBe<void>();

expect(test.skip(123, fn)).type.toBe<void>();
expect(test.skip(() => {}, fn)).type.toBe<void>();
expect(test.skip(function named() {}, fn)).type.toBe<void>();
expect(test.skip(class {}, fn)).type.toBe<void>();
expect(test.skip(class Named {}, fn)).type.toBe<void>();

expect(test.skip.each).type.toBe(test.each);
expect(test.skip.failing).type.toBe(test.failing);
expect(test.skip.failing.each).type.toBe(test.each);

// test.todo

expect(test.todo(testName)).type.toBe<void>();

expect(test.todo(123)).type.toBe<void>();
expect(test.todo(() => {})).type.toBe<void>();
expect(test.todo(function named() {})).type.toBe<void>();
expect(test.todo(class {})).type.toBe<void>();
expect(test.todo(class Named {})).type.toBe<void>();

expect(test.todo()).type.toRaiseError();
expect(test.todo(testName, fn)).type.toRaiseError();

// describe

expect(describe(testName, fn)).type.toBe<void>();

expect(describe()).type.toRaiseError();
expect(describe(fn)).type.toRaiseError();
expect(describe(testName, fn, timeout)).type.toRaiseError();

expect(describe(123, fn)).type.toBe<void>();
expect(describe(() => {}, fn)).type.toBe<void>();
expect(describe(function named() {}, fn)).type.toBe<void>();
expect(describe(class {}, fn)).type.toBe<void>();
expect(describe(class Named {}, fn)).type.toBe<void>();

expect(describe.each(table)(testName, fn)).type.toBe<void>();
expect(describe.each(table)(testName, fn, timeout)).type.toBe<void>();

expect(describe.each(table)(testName, fn)).type.toBe<void>();
expect(describe.each(table)(123, fn)).type.toBe<void>();
expect(describe.each(table)(() => {}, fn)).type.toBe<void>();
expect(describe.each(table)(function named() {}, fn)).type.toBe<void>();
expect(describe.each(table)(class Named {}, fn)).type.toBe<void>();

// describe.only

expect(describe.only(testName, fn)).type.toBe<void>();

expect(describe.only()).type.toRaiseError();
expect(describe.only(fn)).type.toRaiseError();
expect(describe.only(testName, fn, timeout)).type.toRaiseError();

expect(describe.only(123, fn)).type.toBe<void>();
expect(describe.only(() => {}, fn)).type.toBe<void>();
expect(describe.only(function named() {}, fn)).type.toBe<void>();
expect(describe.only(class {}, fn)).type.toBe<void>();
expect(describe.only(class Named {}, fn)).type.toBe<void>();

expect(describe.only.each).type.toBe(describe.each);

// describe.skip

expect(describe.skip(testName, fn)).type.toBe<void>();

expect(describe.skip()).type.toRaiseError();
expect(describe.skip(fn)).type.toRaiseError();
expect(describe.skip(testName, fn, timeout)).type.toRaiseError();

expect(describe.skip(123, fn)).type.toBe<void>();
expect(describe.skip(() => {}, fn)).type.toBe<void>();
expect(describe.skip(function named() {}, fn)).type.toBe<void>();
expect(describe.skip(class {}, fn)).type.toBe<void>();
expect(describe.skip(class Named {}, fn)).type.toBe<void>();

expect(describe.skip.each).type.toBe(describe.each);
