/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('pending', () => {
  // eslint-disable-next-line no-constant-condition
  if (true) {
    pending('This test is pending.');
  }
  expect(false).toBe(true);
});
