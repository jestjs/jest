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

expect(beforeAll(fn)).type.toBeVoid();
expect(beforeAll(asyncFn)).type.toBeVoid();
expect(beforeAll(genFn)).type.toBeVoid();
expect(
  beforeAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBeVoid();

expect(beforeAll(fn, timeout)).type.toBeVoid();
expect(beforeAll(asyncFn, timeout)).type.toBeVoid();
expect(beforeAll(genFn, timeout)).type.toBeVoid();
expect(
  beforeAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBeVoid();

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

expect(beforeEach(fn)).type.toBeVoid();
expect(beforeEach(asyncFn)).type.toBeVoid();
expect(beforeEach(genFn)).type.toBeVoid();
expect(
  beforeEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBeVoid();

expect(beforeEach(fn, timeout)).type.toBeVoid();
expect(beforeEach(asyncFn, timeout)).type.toBeVoid();
expect(beforeEach(genFn, timeout)).type.toBeVoid();
expect(
  beforeEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBeVoid();

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

expect(afterAll(fn)).type.toBeVoid();
expect(afterAll(asyncFn)).type.toBeVoid();
expect(afterAll(genFn)).type.toBeVoid();
expect(
  afterAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBeVoid();

expect(afterAll(fn, timeout)).type.toBeVoid();
expect(afterAll(asyncFn, timeout)).type.toBeVoid();
expect(afterAll(genFn, timeout)).type.toBeVoid();
expect(
  afterAll(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBeVoid();

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

expect(afterEach(fn)).type.toBeVoid();
expect(afterEach(asyncFn)).type.toBeVoid();
expect(afterEach(genFn)).type.toBeVoid();
expect(
  afterEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBeVoid();

expect(afterEach(fn, timeout)).type.toBeVoid();
expect(afterEach(asyncFn, timeout)).type.toBeVoid();
expect(afterEach(genFn, timeout)).type.toBeVoid();
expect(
  afterEach(done => {
    expect(done).type.toBe<Global.DoneFn>();
  }, timeout),
).type.toBeVoid();

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

expect(test(testName, fn)).type.toBeVoid();
expect(test(testName, asyncFn)).type.toBeVoid();
expect(test(testName, genFn)).type.toBeVoid();
expect(
  test(testName, done => {
    expect(done).type.toBe<Global.DoneFn>();
  }),
).type.toBeVoid();

expect(test(testName, fn, timeout)).type.toBeVoid();
expect(test(testName, asyncFn, timeout)).type.toBeVoid();
expect(test(testName, genFn, timeout)).type.toBeVoid();
expect(
  test(
    testName,
    done => {
      expect(done).type.toBe<Global.DoneFn>();
    },
    timeout,
  ),
).type.toBeVoid();

expect(test(123, fn)).type.toBeVoid();
expect(test(() => {}, fn)).type.toBeVoid();
expect(test(function named() {}, fn)).type.toBeVoid();
expect(test(class {}, fn)).type.toBeVoid();
expect(test(class Named {}, fn)).type.toBeVoid();

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

expect(test.concurrent(testName, asyncFn)).type.toBeVoid();
expect(test.concurrent(testName, asyncFn, timeout)).type.toBeVoid();

expect(test.concurrent(123, asyncFn)).type.toBeVoid();
expect(test.concurrent(() => {}, asyncFn)).type.toBeVoid();
expect(test.concurrent(function named() {}, asyncFn)).type.toBeVoid();
expect(test.concurrent(class {}, asyncFn)).type.toBeVoid();
expect(test.concurrent(class Named {}, asyncFn)).type.toBeVoid();

expect(test.concurrent(testName, fn)).type.toRaiseError();

// test.concurrent.each

expect(test.concurrent.each(table)(testName, asyncFn)).type.toBeVoid();
expect(test.concurrent.each(table)(testName, asyncFn, timeout)).type.toBeVoid();

expect(test.concurrent.each(table)(123, asyncFn)).type.toBeVoid();
expect(test.concurrent.each(table)(() => {}, asyncFn)).type.toBeVoid();
expect(
  test.concurrent.each(table)(function named() {}, asyncFn),
).type.toBeVoid();
expect(test.concurrent.each(table)(class {}, asyncFn)).type.toBeVoid();
expect(test.concurrent.each(table)(class Named {}, asyncFn)).type.toBeVoid();

expect(test.concurrent.each(table)(testName, fn)).type.toRaiseError();

// test.concurrent.failing

expect(test.concurrent.failing(testName, asyncFn)).type.toBeVoid();
expect(test.concurrent.failing(testName, asyncFn, timeout)).type.toBeVoid();

expect(test.concurrent.failing(123, asyncFn)).type.toBeVoid();
expect(test.concurrent.failing(() => {}, asyncFn)).type.toBeVoid();
expect(test.concurrent.failing(function named() {}, asyncFn)).type.toBeVoid();
expect(test.concurrent.failing(class {}, asyncFn)).type.toBeVoid();
expect(test.concurrent.failing(class Named {}, asyncFn)).type.toBeVoid();

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

expect(test.each(table)(testName, fn)).type.toBeVoid();
expect(test.each(table)(testName, fn, timeout)).type.toBeVoid();

expect(test.each(table)(123, fn)).type.toBeVoid();
expect(test.each(table)(() => {}, fn)).type.toBeVoid();
expect(test.each(table)(function named() {}, fn)).type.toBeVoid();
expect(test.each(table)(class {}, fn)).type.toBeVoid();
expect(test.each(table)(class Named {}, fn)).type.toBeVoid();

// test.failing

expect(test.failing(testName, fn)).type.toBeVoid();
expect(test.failing(testName, fn, timeout)).type.toBeVoid();

expect(test.failing(123, fn)).type.toBeVoid();
expect(test.failing(() => {}, fn)).type.toBeVoid();
expect(test.failing(function named() {}, fn)).type.toBeVoid();
expect(test.failing(class {}, fn)).type.toBeVoid();
expect(test.failing(class Named {}, fn)).type.toBeVoid();

expect(test.failing.each).type.toBe(test.each);

// test.only

expect(test.only(testName, fn)).type.toBeVoid();
expect(test.only(testName, fn, timeout)).type.toBeVoid();

expect(test.only(123, fn)).type.toBeVoid();
expect(test.only(() => {}, fn)).type.toBeVoid();
expect(test.only(function named() {}, fn)).type.toBeVoid();
expect(test.only(class {}, fn)).type.toBeVoid();
expect(test.only(class Named {}, fn)).type.toBeVoid();

expect(test.only.each).type.toBe(test.each);
expect(test.only.failing).type.toBe(test.failing);
expect(test.only.failing.each).type.toBe(test.each);

// test.skip

expect(test.skip(testName, fn)).type.toBeVoid();
expect(test.skip(testName, fn, timeout)).type.toBeVoid();

expect(test.skip(123, fn)).type.toBeVoid();
expect(test.skip(() => {}, fn)).type.toBeVoid();
expect(test.skip(function named() {}, fn)).type.toBeVoid();
expect(test.skip(class {}, fn)).type.toBeVoid();
expect(test.skip(class Named {}, fn)).type.toBeVoid();

expect(test.skip.each).type.toBe(test.each);
expect(test.skip.failing).type.toBe(test.failing);
expect(test.skip.failing.each).type.toBe(test.each);

// test.todo

expect(test.todo(testName)).type.toBeVoid();

expect(test.todo(123)).type.toBeVoid();
expect(test.todo(() => {})).type.toBeVoid();
expect(test.todo(function named() {})).type.toBeVoid();
expect(test.todo(class {})).type.toBeVoid();
expect(test.todo(class Named {})).type.toBeVoid();

expect(test.todo()).type.toRaiseError();
expect(test.todo(testName, fn)).type.toRaiseError();

// describe

expect(describe(testName, fn)).type.toBeVoid();

expect(describe()).type.toRaiseError();
expect(describe(fn)).type.toRaiseError();
expect(describe(testName, fn, timeout)).type.toRaiseError();

expect(describe(123, fn)).type.toBeVoid();
expect(describe(() => {}, fn)).type.toBeVoid();
expect(describe(function named() {}, fn)).type.toBeVoid();
expect(describe(class {}, fn)).type.toBeVoid();
expect(describe(class Named {}, fn)).type.toBeVoid();

expect(describe.each(table)(testName, fn)).type.toBeVoid();
expect(describe.each(table)(testName, fn, timeout)).type.toBeVoid();

expect(describe.each(table)(testName, fn)).type.toBeVoid();
expect(describe.each(table)(123, fn)).type.toBeVoid();
expect(describe.each(table)(() => {}, fn)).type.toBeVoid();
expect(describe.each(table)(function named() {}, fn)).type.toBeVoid();
expect(describe.each(table)(class Named {}, fn)).type.toBeVoid();

// describe.only

expect(describe.only(testName, fn)).type.toBeVoid();

expect(describe.only()).type.toRaiseError();
expect(describe.only(fn)).type.toRaiseError();
expect(describe.only(testName, fn, timeout)).type.toRaiseError();

expect(describe.only(123, fn)).type.toBeVoid();
expect(describe.only(() => {}, fn)).type.toBeVoid();
expect(describe.only(function named() {}, fn)).type.toBeVoid();
expect(describe.only(class {}, fn)).type.toBeVoid();
expect(describe.only(class Named {}, fn)).type.toBeVoid();

expect(describe.only.each).type.toBe(describe.each);

// describe.skip

expect(describe.skip(testName, fn)).type.toBeVoid();

expect(describe.skip()).type.toRaiseError();
expect(describe.skip(fn)).type.toRaiseError();
expect(describe.skip(testName, fn, timeout)).type.toRaiseError();

expect(describe.skip(123, fn)).type.toBeVoid();
expect(describe.skip(() => {}, fn)).type.toBeVoid();
expect(describe.skip(function named() {}, fn)).type.toBeVoid();
expect(describe.skip(class {}, fn)).type.toBeVoid();
expect(describe.skip(class Named {}, fn)).type.toBeVoid();

expect(describe.skip.each).type.toBe(describe.each);
