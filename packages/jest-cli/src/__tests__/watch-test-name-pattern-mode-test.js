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
      findMatchingTests(pattern) {
        return {paths: []};
      }
    },
);

jest.doMock('chalk', () =>
  Object.assign(new chalk.constructor({enabled: false}), {
    stripColor: str => str,
  }),
);

jest.doMock(
  '../runJest',
  () =>
    function() {
      const args = Array.from(arguments);
      runJestMock.apply(null, args);

      // Call the callback
      args[args.length - 1]({
        snapshot: {},
        testResults: [
          {
            testResults: [{title: 'should return the correct index when'}],
          },
          {
            testResults: [{title: 'should allow test siblings to modify'}],
          },
          {
            testResults: [{title: 'might get confusing'}],
          },
          {
            testResults: [
              {title: 'should handle length properties that cannot'},
            ],
          },
          {
            testResults: [{title: 'should recognize various types'}],
          },
          {
            testResults: [{title: 'should recognize null and undefined'}],
          },
          {
            testResults: [{title: 'should not output colors to pipe'}],
          },
          {
            testResults: [{title: 'should convert string to a RegExp'}],
          },
          {
            testResults: [
              {title: 'should escape and convert string to a RegExp'},
            ],
          },
          {
            testResults: [{title: 'should convert grep string to a RegExp'}],
          },
        ],
      });

      return Promise.resolve();
    },
);

jest.doMock('../lib/terminalUtils', () => ({
  getTerminalWidth: () => terminalWidth,
}));

const watch = require('../watch');

const toHex = char => Number(char.charCodeAt(0)).toString(16);

const globalConfig = {
  watch: true,
};

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

  it('Pressing "T" enters pattern mode', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.T);
    expect(pipe.write).toBeCalledWith(' pattern › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    // Write a pattern
    ['c', 'o', 'n', ' ', '1', '2'].map(toHex).forEach(assertPattern);

    [KEYS.BACKSPACE, KEYS.BACKSPACE].forEach(assertPattern);

    ['*'].map(toHex).forEach(assertPattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    // Argv is updated with the current pattern
    expect(argv).toEqual({
      onlyChanged: false,
      testNamePattern: 'con *',
      watch: true,
      watchAll: false,
    });
  });

  it('can select a specific test name from the typeahead results', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.T);

    // Write a pattern
    ['c', 'o', 'n']
    .map(toHex)
    .concat([KEYS.ARROW_DOWN, KEYS.ARROW_DOWN, KEYS.ARROW_DOWN, KEYS.ARROW_UP])
    .forEach(key => stdin.emit(key));

    stdin.emit(KEYS.ENTER);

    expect(argv.testNamePattern).toMatchSnapshot();
  });

  it('Results in pattern mode get truncated appropriately', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

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
