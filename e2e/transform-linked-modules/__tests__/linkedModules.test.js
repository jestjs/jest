/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('normal file', () => {
  const normal = require('../ignored/normal');
  expect(normal).toBe('ignored/normal');
});

test('symlink', () => {
  const symlink = require('../ignored/symlink');
  expect(symlink).toBe('transformed');
});
