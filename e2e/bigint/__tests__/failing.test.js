/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it('fails comparing bigints', () => {
  expect(1n + 3n).toBe(10n);
});
