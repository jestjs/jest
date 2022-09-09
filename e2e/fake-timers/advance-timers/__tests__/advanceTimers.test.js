/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('advances timers if true is passed', done => {
  jest.useFakeTimers({advanceTimers: true});

  const start = Date.now();

  setTimeout(() => {
    done();
    expect(Date.now() - start).toEqual(45);
  }, 45);
});

test('advances timers if a number is passed', done => {
  jest.useFakeTimers({advanceTimers: 40});

  const start = Date.now();

  setTimeout(() => {
    done();
    expect(Date.now() - start).toEqual(35);
  }, 35);
});

test('works with `now` option', done => {
  jest.useFakeTimers({advanceTimers: 30, now: new Date('2015-09-25')});

  expect(Date.now()).toEqual(1443139200000);

  const start = Date.now();

  setTimeout(() => {
    done();
    expect(Date.now() - start).toEqual(25);
  }, 25);
});
