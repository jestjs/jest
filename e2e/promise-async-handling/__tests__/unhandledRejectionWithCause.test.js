/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {promisify} = require('util');

function g() {
  throw new Error('error during g');
}

function f() {
  try {
    g();
  } catch (error) {
    throw new Error('error during f', {cause: error});
  }
}

afterAll(async () => {
  let error;
  try {
    f();
  } catch (error_) {
    error = error_;
  }
  Promise.reject(error);

  await promisify(setTimeout)(0);
});

test('foo', () => {});
