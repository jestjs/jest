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

let runCountWithoutOverride = 0;
let runCountWithOverride = 0;

describe('testcheck-options', () => {
  check.it('runs things ten times by default', [], () => {
    runCountWithoutOverride++;
  });

  check.it('allows overrides', {times: 1}, [], () => {
    runCountWithOverride++;
  });

  check.it('generates correctly-sized arrays', [gen.array(gen.int)], a => {
    expect(a.length).toBeLessThan(2);
  });

  check.it('has the right seed', [gen.resize(10, gen.array(gen.int))], a => {
    console.log('An array:', a);
  });

  afterAll(() => {
    console.log('runCountWithoutOverride:', runCountWithoutOverride);
    console.log('runCountWithOverride:', runCountWithOverride);
  });
});
