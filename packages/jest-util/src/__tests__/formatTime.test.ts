/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import formatTime from '../formatTime';

it('defaults to milliseconds', () => {
  expect(formatTime(42)).toBe('42 ms');
});

it('formats seconds properly', () => {
  expect(formatTime(42, 0)).toBe('42 s');
});

it('formats milliseconds properly', () => {
  expect(formatTime(42, -3)).toBe('42 ms');
});

it('formats microseconds properly', () => {
  expect(formatTime(42, -6)).toBe('42 μs');
});

it('formats nanoseconds properly', () => {
  expect(formatTime(42, -9)).toBe('42 ns');
});

it('interprets lower than lowest powers as nanoseconds', () => {
  expect(formatTime(42, -12)).toBe('42 ns');
});

it('interprets higher than highest powers as seconds', () => {
  expect(formatTime(42, 3)).toBe('42 s');
});

it('interprets non-multiple-of-3 powers as next higher prefix', () => {
  expect(formatTime(42, -4)).toBe('42 ms');
});

it('formats the quantity properly when pad length is lower', () => {
  expect(formatTime(42, -3, 1)).toBe('42 ms');
});

it('formats the quantity properly when pad length is equal', () => {
  expect(formatTime(42, -3, 2)).toBe('42 ms');
});

it('left pads the quantity properly when pad length is higher', () => {
  expect(formatTime(42, -3, 5)).toBe('   42 ms');
});
