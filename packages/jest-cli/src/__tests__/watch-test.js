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

jest.doMock('chalk', () => new chalk.constructor({enabled: false}));
jest.doMock('../runJest', () => function() {
  const args = Array.from(arguments);
  runJestMock.apply(null, args);

  // Call the callback
  args[args.length - 1]({snapshot: {}});

  return Promise.resolve();
});

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
    pipe = {write: jest.fn()};
    hasteMap = {on: () => {}};
    argv = {};
    hasteContext = {};
    config = {roots: [], testPathIgnorePatterns: [], testRegex: ''};
    stdin = new MockStdin();
  });

  it('Runs Jest once by default and shows usage', () => {
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);
    expect(runJestMock).toBeCalledWith(
      hasteContext,
      config,
      argv,
      pipe,
      new TestWatcher({isWatchMode: true}),
      jasmine.any(Function),
      jasmine.any(Function),
    );
    expect(pipe.write.mock.calls.reverse()[0]).toMatchSnapshot();
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

    expect(runJestMock.mock.calls[0][1]).toEqual({
      roots: [],
      testPathIgnorePatterns: [],
      testRegex: '',
      updateSnapshot: true,
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
