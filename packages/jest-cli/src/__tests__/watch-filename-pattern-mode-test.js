/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const chalk = require('chalk');
const {KEYS} = require('../constants');

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
  '../SearchSource',
  () =>
    class {
      constructor(context) {
        this._context = context;
      }

      findMatchingTests(pattern) {
        const paths = [
          './path/to/file1-test.js',
          './path/to/file2-test.js',
          './path/to/file3-test.js',
          './path/to/file4-test.js',
          './path/to/file5-test.js',
          './path/to/file6-test.js',
          './path/to/file7-test.js',
          './path/to/file8-test.js',
          './path/to/file9-test.js',
          './path/to/file10-test.js',
          './path/to/file11-test.js',
        ].filter(path => path.match(pattern));

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

jest.doMock('chalk', () =>
  Object.assign(new chalk.constructor({enabled: false}), {
    stripColor: str => str,
  }));

jest.doMock(
  '../runJest',
  () =>
    function() {
      const args = Array.from(arguments);
      runJestMock.apply(null, args);

      // Call the callback
      args[args.length - 1]({snapshot: {}});

      return Promise.resolve();
    },
);

jest.doMock('../lib/terminalUtils', () => ({
  getTerminalWidth: () => terminalWidth,
}));

const watch = require('../watch');


const toHex = char => Number(char.charCodeAt(0)).toString(16);

const globalConfig = {watch: true};

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMapInstances;
  let argv;
  let contexts;
  let stdin;

  beforeEach(() => {
    terminalWidth = 80;
    pipe = {write: jest.fn()};
    hasteMapInstances = [{on: () => {}}];
    argv = {};
    contexts = [{config: {}}];
    stdin = new MockStdin();
  });

  it('Pressing "P" enters pattern mode', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.P);
    expect(pipe.write).toBeCalledWith(' pattern › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    // Write a pattern
    ['p', '.', '*', '1', '0'].map(toHex).forEach(assertPattern);

    [KEYS.BACKSPACE, KEYS.BACKSPACE].forEach(assertPattern);

    ['3'].map(toHex).forEach(assertPattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    // Argv is updated with the current pattern
    expect(argv).toEqual({
      onlyChanged: false,
      testPathPattern: 'p.*3',
      watch: true,
      watchAll: false,
    });
  });

  it('Results in pattern mode get truncated appropriately', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    stdin.emit(KEYS.P);

    [30, 25, 20].forEach(width => {
      terminalWidth = width;
      stdin.emit(KEYS.BACKSPACE);
      pipe.write.mockReset();
      stdin.emit(KEYS.A);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    });
  });

  it('Shows the appropiate header when the filename filter is active', () => {
    contexts[0].config = {rootDir: ''};
    watch(contexts, argv, pipe, hasteMapInstances, stdin);

    stdin.emit(KEYS.P);

    ['p', '.', '*', '1', '0']
      .map(toHex)
      .concat(KEYS.ENTER)
      .forEach(key => stdin.emit(key));

    pipe.write.mockReset();
    stdin.emit(KEYS.P);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();

    ['p'].map(toHex).concat(KEYS.ENTER).forEach(key => stdin.emit(key));

    pipe.write.mockReset();
    stdin.emit(KEYS.P);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  it('Shows the appropiate header when the test name filter is active', () => {
    contexts[0].config = {rootDir: ''};
    watch(contexts, argv, pipe, hasteMapInstances, stdin);

    stdin.emit(KEYS.T);

    ['t', 'e', 's', 't']
      .map(toHex)
      .concat(KEYS.ENTER)
      .forEach(key => stdin.emit(key));

    pipe.write.mockReset();
    stdin.emit(KEYS.T);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();

    ['t'].map(toHex).concat(KEYS.ENTER).forEach(key => stdin.emit(key));

    pipe.write.mockReset();
    stdin.emit(KEYS.T);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  it('Shows the appropiate header when both filters are active', () => {
    contexts[0].config = {rootDir: ''};
    watch(contexts, argv, pipe, hasteMapInstances, stdin);

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

    pipe.write.mockReset();
    stdin.emit(KEYS.T);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  it('Pressing "c" clears the filters', () => {
    contexts[0].config = {rootDir: ''};
    watch(contexts, argv, pipe, hasteMapInstances, stdin);

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

    stdin.emit(KEYS.C);

    pipe.write.mockReset();
    stdin.emit(KEYS.P);
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
