/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import chalk from 'chalk';
import {KEYS} from '../constants';

const runJestMock = jest.fn();

let terminalWidth;

jest.mock('ansi-escapes', () => ({
  clearScreen: '[MOCK - clearScreen]',
  cursorDown: (count = 1) => `[MOCK - cursorDown(${count})]`,
  cursorHide: '[MOCK - cursorHide]',
  cursorRestorePosition: '[MOCK - cursorRestorePosition]',
  cursorSavePosition: '[MOCK - cursorSavePosition]',
  cursorShow: '[MOCK - cursorShow]',
  cursorTo: (x, y) => `[MOCK - cursorTo(${x}, ${y})]`,
}));

jest.mock(
  '../search_source',
  () =>
    class {
      constructor(context) {
        this._context = context;
      }

      findTestsWithTags(tags) {
        const paths = ['./a-b.js', './b-c.js', './c.js'].filter(path =>
          tags.some(tag => path.indexOf(tag) >= 0),
        );

        return {
          tests: paths.map(path => ({
            context: this._context,
            duration: null,
            path,
          })),
        };
      }
    },
);

jest.doMock('chalk', () => new chalk.constructor({enabled: false}));

jest.doMock('strip-ansi');
require('strip-ansi').mockImplementation(str => str);

jest.doMock(
  '../run_jest',
  () =>
    function() {
      const args = Array.from(arguments);
      const [{onComplete}] = args;
      runJestMock.apply(null, args);

      // Call the callback
      onComplete({snapshot: {}});

      return Promise.resolve();
    },
);

jest.doMock('../lib/terminal_utils', () => ({
  getTerminalWidth: () => terminalWidth,
}));

const watch = require('../watch').default;

const toHex = char => Number(char.charCodeAt(0)).toString(16);

const globalConfig = {watch: true};

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMapInstances;
  let contexts;
  let stdin;

  beforeEach(() => {
    terminalWidth = 80;
    pipe = {write: jest.fn()};
    hasteMapInstances = [{on: () => {}}];
    contexts = [{config: {}}];
    stdin = new MockStdin();
  });

  it('Pressing "G" enters pattern mode', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.G);
    expect(pipe.write).toBeCalledWith(' @tags › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    // Write a pattern
    ['a', ',', 'b'].map(toHex).forEach(assertPattern);

    [KEYS.BACKSPACE].forEach(assertPattern);

    ['c'].map(toHex).forEach(assertPattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    // globalConfig is updated with the current pattern
    expect(runJestMock.mock.calls[0][0].globalConfig).toEqual({
      onlyChanged: false,
      passWithNoTests: true,
      testNamePattern: '',
      testPathPattern: '',
      testTags: ['a', 'c'],
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "c" clears the filters', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    stdin.emit(KEYS.P);
    ['p', '.', '*', '1', '0']
      .map(toHex)
      .concat(KEYS.ENTER)
      .forEach(key => stdin.emit(key));

    stdin.emit(KEYS.T);
    ['t', 'e', 's', 't']
      .map(toHex)
      .concat(KEYS.ENTER)
      .forEach(key => stdin.emit(key));

    stdin.emit(KEYS.G);
    ['a', ',', 'b']
      .map(toHex)
      .concat(KEYS.ENTER)
      .forEach(key => stdin.emit(key));

    stdin.emit(KEYS.C);

    pipe.write.mockReset();
    stdin.emit(KEYS.G);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });
});

class MockStdin {
  constructor() {
    this._callbacks = [];
  }

  setRawMode() {}

  resume() {}

  setEncoding() {}

  on(evt, callback) {
    this._callbacks.push(callback);
  }

  emit(key) {
    this._callbacks.forEach(cb => cb(key));
  }
}
