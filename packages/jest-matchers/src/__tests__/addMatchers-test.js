/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const addMatchers = require('../').addMatchers;

addMatchers({
  toBeDivisibleBy(actual, expected) {
    const pass = actual % expected === 0;
    const message = pass
      ? `expected ${actual} not to be divisible by ${expected}`
      : `expected ${actual} to be divisible by ${expected}`;

    return {message, pass};
  },
});

it('is available globally', () => {
  expect(15).toBeDivisibleBy(5);
  expect(15).toBeDivisibleBy(3);
  expect(15).not.toBeDivisibleBy(6);

  let error;
  try {
    expect(15).toBeDivisibleBy(2);
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.message).toMatch(/to be divisible/);
});
