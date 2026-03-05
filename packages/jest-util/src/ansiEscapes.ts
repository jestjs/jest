/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Inline ANSI escape sequences, replacing the ansi-escapes package.
// These are standard VT100/ECMA-48 sequences.

const ESC = '\u001B[';

export const cursorUp = (n = 1): string => `${ESC}${n}A`;
export const cursorDown = (n = 1): string => `${ESC}${n}B`;
export const cursorTo = (x: number, y?: number): string =>
  y == null ? `${ESC}${x + 1}G` : `${ESC}${y + 1};${x + 1}H`;
export const cursorHide = `${ESC}?25l`;
export const cursorShow = `${ESC}?25h`;
export const cursorLeft = `${ESC}G`;

const isTerminalApp = process.env.TERM_PROGRAM === 'Apple_Terminal';
export const cursorSavePosition = isTerminalApp ? '\u001B7' : `${ESC}s`;
export const cursorRestorePosition = isTerminalApp ? '\u001B8' : `${ESC}u`;

export const eraseDown = `${ESC}J`;
export const eraseLine = `${ESC}2K`;
