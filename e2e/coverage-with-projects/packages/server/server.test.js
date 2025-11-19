/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {multiply} = require('./server');

test('multiply function', () => {
  expect(multiply(2, 3)).toBe(6);
});
