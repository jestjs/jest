/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */

test('use toBe compare two div', () => {
  const div1 = document.createElement('div');
  const div2 = document.createElement('div');
  expect(div1).toBe(div2);
});

test('compare span and div', () => {
  expect(document.createElement('div')).toBe(document.createElement('span'));
});
