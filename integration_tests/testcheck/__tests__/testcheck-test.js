/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const check = require('jest-check').check;
const gen = require('jest-check').gen;

describe('testcheck', () => {
  check.it('works', [gen.int], a => {
    expect(a).toEqual(jasmine.any(Number));
  });

  check.it('reports failures', [], () => {
    expect(true).toBe(false);
  });

  check.xit('skips tests', [], () => {
    expect(true).toBe(false);
  });
});
