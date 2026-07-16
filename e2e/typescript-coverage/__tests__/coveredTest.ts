/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it('adds 1 + 2 to equal 3 in TScript', () => {
  const {sum} = require('../covered.ts');
  expect(sum(1, 2)).toBe(3);
});
