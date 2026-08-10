/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('throw when directly imported', () => {
  expect(() => {
    require('../');
  }).toThrow(
    'Do not import `@jest/globals` outside of the Jest test environment',
  );
});
