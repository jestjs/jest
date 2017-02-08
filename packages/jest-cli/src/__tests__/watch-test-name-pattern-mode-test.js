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

jest.mock('../SearchSource', () => class {
  findMatchingTests(pattern) {
    return {paths: []};
  }
});

jest.doMock('chalk', () => Object.assign(
  new chalk.constructor({enabled: false}),
  {stripColor: str => str},
));

jest.doMock('../runJest', () => function() {
  const args = Array.from(arguments);
  runJestMock.apply(null, args);

  // Call the callback
  args[args.length - 1]({
    snapshot: {},
    testResults: [
      {
        testFilePath: './path/to/file1-test.js',
        testResults: [{title: 'test 1'}],
      },
      {
        testFilePath: './path/to/file2-test.js',
        testResults: [{title: 'test 2'}],
      },
      {
        testFilePath: './path/to/file3-test.js',
        testResults: [{title: 'test 3'}],
      },
      {
        testFilePath: './path/to/file4-test.js',
        testResults: [{title: 'test 4'}],
      },
      {
        testFilePath: './path/to/file5-test.js',
        testResults: [{title: 'test 5'}],
      },
      {
        testFilePath: './path/to/file6-test.js',
        testResults: [{title: 'test 6'}],
      },
      {
        testFilePath: './path/to/file7-test.js',
        testResults: [{title: 'test 7'}],
      },
      {
        testFilePath: './path/to/file8-test.js',
        testResults: [{title: 'test 8'}],
      },
      {
        testFilePath: './path/to/file9-test.js',
        testResults: [{title: 'test 9'}],
      },
      {
        testFilePath: './path/too/file9-test.js',
        testResults: [{title: 'test 9'}],
      },
    ],
  });

  return Promise.resolve();
});

jest.doMock('../lib/terminalUtils', () => ({
  getTerminalWidth: () => terminalWidth,
}));

const watch = require('../watch');

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMap;
  let argv;
  let hasteContext;
  let config;
  let stdin;

  beforeEach(() => {
    terminalWidth = 80;
    pipe = {write: jest.fn()};
    hasteMap = {on: () => {}};
    argv = {};
    hasteContext = {};
    config = {};
    stdin = new MockStdin();
  });

  it('Pressing "T" enters pattern mode', () => {
    config = {rootDir: ''};
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.T);
    expect(pipe.write).toBeCalledWith(' pattern › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    const toHex = char => Number(char.charCodeAt(0)).toString(16);

    // Write a pattern
    ['t', 'e', 's', 't', ' ', '1', '2']
    .map(toHex)
    .forEach(assertPattern);

    [KEYS.BACKSPACE, KEYS.BACKSPACE]
    .forEach(assertPattern);

    ['*']
    .map(toHex)
    .forEach(assertPattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    // Argv is updated with the current pattern
    expect(argv).toEqual({
      onlyChanged: false,
      testNamePattern: 'test *',
      watch: true,
      watchAll: false,
    });
  });

  it('Results in pattern mode get truncated appropriately', () => {
    config = {rootDir: ''};
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);

    stdin.emit(KEYS.T);

    [50, 30].forEach(width => {
      terminalWidth = width;
      stdin.emit(KEYS.BACKSPACE);
      pipe.write.mockReset();
      stdin.emit(KEYS.T);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    });
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
