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
        numFailedTests: 1,
        snapshot: {
          failure: true,
        },
        testResults: [
          {
            snapshot: {
              unmatched: 1,
            },
            testFilePath: 'bob.js',
          },
        ],
      });

      return Promise.resolve();
    },
);

const runSnapshotInteractiveMode = jest.fn();
jest.doMock('../SnapshotInteractiveMode', () => {
  return class {
    constructor(pipe) {
      this.run = runSnapshotInteractiveMode;
    }
    isActive() {
      return false;
    }
  };
});

jest.doMock('../lib/terminalUtils', () => ({
  getTerminalWidth: () => terminalWidth,
}));

const watch = require('../watch');

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

  it('Pressing "I" enters pattern mode', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.I);
    expect(runSnapshotInteractiveMode).toHaveBeenCalledWith(
      ['bob.js'],
      expect.anything(),
    );
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
