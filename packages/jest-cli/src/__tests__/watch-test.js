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
const TestWatcher = require('../TestWatcher');
const {KEYS} = require('../constants');

const runJestMock = jest.fn();

jest.mock('jest-util', () => ({clearLine: () => {}}));
jest.doMock('chalk', () => new chalk.constructor({enabled: false}));
jest.doMock('../constants', () => ({CLEAR: '', KEYS}));
jest.doMock('../runJest', () => (...args) => {
  runJestMock(...args);

  // Call the callback
  args[args.length - 1]({snapshot: {}});

  return Promise.resolve();
});

const watch = require('../watch');

const USAGE_MESSAGE = `
Watch Usage
 › Press o to only run tests related to changed files.
 › Press p to filter by a filename regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.`;

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMap;
  let argv;
  let hasteContext;
  let config;
  let stdin;

  beforeEach(() => {
    pipe = {write: jest.fn()};
    hasteMap = {on: () => {}};
    argv = {};
    hasteContext = {};
    config = {};
    stdin = new MockStdin();
  });

  it('Runs Jest once by default and shows usage', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    expect(runJestMock).toBeCalledWith(hasteContext, config, argv, pipe,
      new TestWatcher({isWatchMode: true}), jasmine.any(Function));
    expect(pipe.write).toBeCalledWith(USAGE_MESSAGE);
  });

  it('Pressing "o" runs test in "only changed files" mode', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.O);

    expect(runJestMock).toBeCalled();
    expect(argv).toEqual({
      '_': '',
      onlyChanged: true,
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "a" runs test in "watch all" mode', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.A);

    expect(runJestMock).toBeCalled();
    expect(argv).toEqual({
      '_': '',
      onlyChanged: false,
      watch: false,
      watchAll: true,
    });
  });

  it('Pressing "P" enters pattern mode', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.P);
    expect(pipe.write).toBeCalledWith(' pattern › ');

    // Write a pattern
    stdin.emit(KEYS.P);
    stdin.emit(KEYS.O);
    stdin.emit(KEYS.A);
    expect(pipe.write).toBeCalledWith(' pattern › poa');

    //Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    //Argv is updated with the current pattern
    expect(argv).toEqual({
      '_': ['poa'],
      onlyChanged: false,
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "ENTER" reruns the tests', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    expect(runJestMock).toHaveBeenCalledTimes(1);
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toHaveBeenCalledTimes(2);
  });

  it('Pressing "u" reruns the tests in "update snapshot" mode', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.U);

    expect(runJestMock.mock.calls[0][1]).toEqual({updateSnapshot: true});
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
