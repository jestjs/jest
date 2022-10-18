/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Reference: https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_(Control_Sequence_Introducer)_sequences

const isTerminalApp = process.env.TERM_PROGRAM === 'Apple_Terminal';
const isWindows = process.platform === 'win32';

export const clearTerminal = isWindows
  ? '\x1b[2J\x1b[0f'
  : '\x1b[2J\x1b[3J\x1b[H';

export const cursorUp = (rows = 1): string => `\x1b[${rows}A`;
export const cursorDown = (rows = 1): string => `\x1b[${rows}B`;

export const cursorToFirstColumn = '\x1b[G';

export const cursorTo = (row: number, column: number): string =>
  `\x1b[${row};${column}H`;

export const eraseScreenDown = '\x1b[J';

export const eraseLine = '\x1b[2K';

export const saveCursorPosition = isTerminalApp ? '\x1b7' : '\x1b[s';
export const restoreCursorPosition = isTerminalApp ? '\x1b8' : '\x1b[u';

export const hideCursor = '\x1b[?25l';
export const showCursor = '\x1b[?25h';
