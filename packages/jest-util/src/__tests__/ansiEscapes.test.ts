/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ansiEscapes from '../ansiEscapes';

const oldTermProgram = process.env.TERM_PROGRAM;

afterEach(() => {
  process.env.TERM_PROGRAM = oldTermProgram;
});

describe('ansiEscapes', () => {
  test('clearTerminal sequence', () => {
    expect(ansiEscapes.clearTerminal).toMatchSnapshot();
  });

  test('returns cursorUp sequence', () => {
    expect(ansiEscapes.cursorUp()).toMatchSnapshot();
  });

  test('allows passing an argument to cursorUp function', () => {
    expect(ansiEscapes.cursorUp(2)).toMatchSnapshot();
  });

  test('returns cursorDown sequence', () => {
    expect(ansiEscapes.cursorDown()).toMatchSnapshot();
  });

  test('allows passing an argument to cursorDown function', () => {
    expect(ansiEscapes.cursorDown(2)).toMatchSnapshot();
  });

  test('cursorToFirstColumn sequence', () => {
    expect(ansiEscapes.cursorToFirstColumn).toMatchSnapshot();
  });

  test('allows passing arguments to cursorTo function', () => {
    expect(ansiEscapes.cursorTo(3, 12)).toMatchSnapshot();
  });

  test('eraseScreenDown sequence', () => {
    expect(ansiEscapes.eraseScreenDown).toMatchSnapshot();
  });

  test('eraseLine sequence', () => {
    expect(ansiEscapes.eraseLine).toMatchSnapshot();
  });

  test('saveCursorPosition sequence', () => {
    expect(ansiEscapes.saveCursorPosition).toMatchSnapshot();
  });

  test('saveCursorPosition sequence on Terminal App', () => {
    process.env.TERM_PROGRAM = 'Apple_Terminal';

    expect(ansiEscapes.saveCursorPosition).toMatchSnapshot();
  });

  test('restoreCursorPosition sequence', () => {
    expect(ansiEscapes.restoreCursorPosition).toMatchSnapshot();
  });

  test('restoreCursorPosition sequence on Terminal App', () => {
    process.env.TERM_PROGRAM = 'Apple_Terminal';

    expect(ansiEscapes.restoreCursorPosition).toMatchSnapshot();
  });

  test('hideCursor sequence', () => {
    expect(ansiEscapes.hideCursor).toMatchSnapshot();
  });

  test('showCursor sequence', () => {
    expect(ansiEscapes.showCursor).toMatchSnapshot();
  });
});
