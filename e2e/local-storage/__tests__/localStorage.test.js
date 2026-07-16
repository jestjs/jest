/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('localStorage CRUD', () => {
  expect(localStorage).toHaveLength(0);

  localStorage.setItem('a', '1');
  localStorage.setItem('b', '2');
  expect(localStorage.getItem('a')).toBe('1');
  expect(localStorage.getItem('b')).toBe('2');
  expect(localStorage).toHaveLength(2);

  localStorage.removeItem('a');
  expect(localStorage.getItem('a')).toBeNull();
  expect(localStorage).toHaveLength(1);

  localStorage.clear();
  expect(localStorage).toHaveLength(0);
});
