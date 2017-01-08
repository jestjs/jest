/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const CLEAR = process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';

const KEYS = {
  A: '61',
  ARROW_DOWN: '1b5b42',
  ARROW_LEFT: '1b5b44',
  ARROW_RIGHT: '1b5b43',
  ARROW_UP: '1b5b41',
  BACKSPACE: process.platform === 'win32' ? '08' : '7f',
  CONTROL_C: '03',
  CONTROL_D: '04',
  ENTER: '0d',
  ESCAPE: '1b',
  O: '6f',
  P: '70',
  Q: '71',
  QUESTION_MARK: '3f',
  U: '75',
};

module.exports = {CLEAR, KEYS};
