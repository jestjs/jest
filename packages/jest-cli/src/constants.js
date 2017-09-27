/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const isWindows = process.platform === 'win32';

export const CLEAR = isWindows ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';

export const KEYS = {
  A: '61',
  ARROW_DOWN: '1b5b42',
  ARROW_LEFT: '1b5b44',
  ARROW_RIGHT: '1b5b43',
  ARROW_UP: '1b5b41',
  BACKSPACE: isWindows ? '08' : '7f',
  C: '63',
  CONTROL_C: '03',
  CONTROL_D: '04',
  ENTER: '0d',
  ESCAPE: '1b',
  O: '6f',
  P: '70',
  Q: '71',
  QUESTION_MARK: '3f',
  T: '74',
  U: '75',
  W: '77',
};

export const ICONS = {
  failed: isWindows ? '\u00D7' : '\u2715',
  pending: '\u25CB',
  success: isWindows ? '\u221A' : '\u2713',
};
