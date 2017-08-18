/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const sum = require('../sum');

it('no ancestors', () => {
  expect(true).toBeTruthy();
});

describe('sum', () => {
  it('adds numbers', () => {
    expect(sum(1, 2)).toEqual(3);
  });

  describe('failing tests', () => {
    it('fails the test', () => {
      expect(sum(1, 2)).toEqual(4);
    });
  });
});
