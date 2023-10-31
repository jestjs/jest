/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {promisify} = require('util');

test('w/o event loop turn after rejection', () => {
  Promise.reject(new Error('REJECTED'));
});

test('w/ event loop turn after rejection in async function', async () => {
  Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);
});

test('w/ event loop turn after rejection in sync function', done => {
  Promise.reject(new Error('REJECTED'));

  setTimeout(done, 0);
});

test('combined w/ another failure _after_ promise rejection', async () => {
  Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  expect(true).toBe(false);
});
