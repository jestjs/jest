/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

// When a file focuses tests with `.only`, the unfocused tests are reported as
// skipped (pending) in a real run. `--collect-tests` must reflect the same.

test.only('focused passes', () => {
  expect(true).toBe(true);
});

test('unfocused becomes skipped', () => {
  throw new Error('should never run');
});

test.todo('todo survives focus');
