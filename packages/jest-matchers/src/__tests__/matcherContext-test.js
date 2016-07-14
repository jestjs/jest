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

const {addMatchers} = require('..');

addMatchers({
  _ensureMatchersHaveAccessToContext(actual) {
    actual.call(this);
    return {pass: !this.isNot, message: ''};
  },
});

test('matchers can access matcher context', () => {
  expect(function() {
    expect(this.isNot).toBe(false);
  })._ensureMatchersHaveAccessToContext();

  expect(function() {
    expect(this.isNot).toBe(true);
  }).not._ensureMatchersHaveAccessToContext();
});
