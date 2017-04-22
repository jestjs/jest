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

const watch = require('../watch');
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
    const config = {roots: [], testPathIgnorePatterns: [], testRegex: ''};
    pipe = {write: jest.fn()};
    hasteMapInstances = [{on: () => {}}];
    argv = {};
    contexts = [{config}];
    stdin = new MockStdin();
  });

  it('Correctly passing test path pattern', () => {
    argv.testPathPattern = 'test-*';
    contexts[0].config.testPathPattern = 'test-*';

    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    expect(runJestMock).toBeCalledWith(
      globalConfig,
      contexts,
      argv,
      pipe,
      new TestWatcher({isWatchMode: true}),
      jasmine.any(Function),
      jasmine.any(Function),
    );
  });

  it('Correctly passing test name pattern', () => {
    argv.testNamePattern = 'test-*';
    contexts[0].config.testNamePattern = 'test-*';

    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);

    expect(runJestMock).toBeCalledWith(
      globalConfig,
      contexts,
      argv,
      pipe,
      new TestWatcher({isWatchMode: true}),
      jasmine.any(Function),
      jasmine.any(Function),
    );
  });

  it('Runs Jest once by default and shows usage', () => {
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);
    expect(runJestMock).toBeCalledWith(
      globalConfig,
      contexts,
      argv,
      pipe,
      new TestWatcher({isWatchMode: true}),
      jasmine.any(Function),
      jasmine.any(Function),
    );
    expect(pipe.write.mock.calls.reverse()[0]).toMatchSnapshot();
  });

  it('Pressing "o" runs test in "only changed files" mode', () => {
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.O);

    expect(runJestMock).toBeCalled();
    expect(argv).toEqual({
      onlyChanged: true,
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "a" runs test in "watch all" mode', () => {
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.A);

    expect(runJestMock).toBeCalled();
    expect(argv).toEqual({
      onlyChanged: false,
      watch: false,
      watchAll: true,
    });
  });

  it('Pressing "ENTER" reruns the tests', () => {
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);
    expect(runJestMock).toHaveBeenCalledTimes(1);
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toHaveBeenCalledTimes(2);
  });

  it('Pressing "u" reruns the tests in "update snapshot" mode', () => {
    watch(globalConfig, contexts, argv, pipe, hasteMapInstances, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.U);

    expect(runJestMock.mock.calls[0][0]).toEqual({
      updateSnapshot: true,
      watch: true,
    });

    stdin.emit(KEYS.A);
    // updateSnapshot is not sticky after a run.
    expect(runJestMock.mock.calls[1][0]).toEqual({
      watch: true,
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
