/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const isWindows = process.platform === 'win32';

export const KEYS = {
  ARROW_DOWN: '\u001B[B',
  ARROW_LEFT: '\u001B[D',
  ARROW_RIGHT: '\u001B[C',
  ARROW_UP: '\u001B[A',
  BACKSPACE: Buffer.from(isWindows ? '08' : '7f', 'hex').toString(),
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  CONTROL_U: '\u0015',
  ENTER: '\r',
  ESCAPE: '\u001B',
};
