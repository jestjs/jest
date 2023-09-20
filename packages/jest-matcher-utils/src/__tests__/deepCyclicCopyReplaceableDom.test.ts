/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

/// <reference lib="dom" />

/* eslint-env browser*/

import deepCyclicCopyReplaceable from '../deepCyclicCopyReplaceable';

test('should copy dom element', () => {
  const div = document.createElement('div');
  const copied = deepCyclicCopyReplaceable(div);
  expect(copied).toEqual(div);
  expect(div === copied).toBe(false); //assert reference is not the same
});

test('should copy complex element', () => {
  const div = document.createElement('div');
  const span = document.createElement('span');
  div.setAttribute('id', 'div');
  div.innerText = 'this is div';
  div.appendChild(span);
  const copied = deepCyclicCopyReplaceable(div);
  expect(copied).toEqual(div);
  expect(div === copied).toBe(false); //assert reference is not the same
  expect(div.children[0] === copied.children[0]).toBe(false); //assert reference is not the same
});
