/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// The global `expect` is injected by the runner from the host module registry.
// When the test file requires 'expect' itself it gets a separate instance from
// jest-runtime's own registry.  The two JestAssertionError classes are
// identical in shape but different objects, so a naive `instanceof` check
// fails.  Regression test for https://github.com/jestjs/jest/issues/14882.
const {JestAssertionError} = require('expect');

test('toThrow(JestAssertionError) passes when a matcher assertion fails', () => {
  expect(() => {
    expect('1').toBe(2);
  }).toThrow(JestAssertionError);
});
