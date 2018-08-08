/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const isWindows = process.platform === 'win32';

export const CLEAR = isWindows ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H';
export const ARROW = ' \u203A ';
export const ICONS = {
  failed: isWindows ? '\u00D7' : '\u2715',
  pending: '\u25CB',
  success: isWindows ? '\u221A' : '\u2713',
};
export const PACKAGE_JSON = 'package.json';
export const JEST_CONFIG = 'jest.config.js';
