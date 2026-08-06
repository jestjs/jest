/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// `require('expect')` in a test file must resolve to the same module instance
// that backs the global `expect`, so JestAssertionError is the same class.
const {JestAssertionError} = require('expect');

test('toThrow(JestAssertionError) passes when a matcher assertion fails', () => {
  expect(() => {
    expect('1').toBe(2);
  }).toThrow(JestAssertionError);
});
