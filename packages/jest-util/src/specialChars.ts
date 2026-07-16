/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const isWindows = process.platform === 'win32';

export const ARROW = ' \u203A ';
export const ICONS = {
  failed: isWindows ? '\u00D7' : '\u2715',
  pending: '\u25CB',
  success: isWindows ? '\u221A' : '\u2713',
  todo: '\u270E',
};

export const CLEAR = isWindows
  ? '\u001B[2J\u001B[0f'
  : '\u001B[2J\u001B[3J\u001B[H';
