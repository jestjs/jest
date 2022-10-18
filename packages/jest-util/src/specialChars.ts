/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {clearTerminal} from './ansiEscapes';

const isWindows = process.platform === 'win32';

export const ARROW = ' \u203A ';
export const ICONS = {
  failed: isWindows ? '\u00D7' : '\u2715',
  pending: '\u25CB',
  success: isWindows ? '\u221A' : '\u2713',
  todo: '\u270E',
};

// TODO Remove reexport in Jest 30
export const CLEAR = clearTerminal;
