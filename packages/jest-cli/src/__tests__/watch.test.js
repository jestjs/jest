/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import chalk from 'chalk';
import TestWatcher from '../test_watcher';
import JestHooks from '../jest_hooks';
import {KEYS} from '../constants';

const runJestMock = jest.fn();
const watchPluginPath = `${__dirname}/__fixtures__/watch_plugin`;
const watchPlugin2Path = `${__dirname}/__fixtures__/watch_plugin2`;
let results;

jest.mock(
  '../search_source',
  () =>
    class {
      constructor(context) {
        this._context = context;
      }

      findMatchingTests(pattern) {
        const paths = [
          './path/to/file1-test.js',
          './path/to/file2-test.js',
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

jest.doMock('chalk', () => new chalk.constructor({enabled: false}));
jest.doMock(
  '../run_jest',
  () =>
    function() {
      const args = Array.from(arguments);
      const [{onComplete}] = args;
      runJestMock.apply(null, args);

      // Call the callback
      onComplete(results);

      return Promise.resolve();
    },
);

jest.doMock(
  watchPluginPath,
  () =>
    class WatchPlugin1 {
      getUsageInfo() {
        return {
          key: 's'.codePointAt(0),
          prompt: 'do nothing',
        };
      }
    },
  {virtual: true},
);

jest.doMock(
  watchPlugin2Path,
  () =>
    class WatchPlugin2 {
      getUsageInfo() {
        return {
          key: 'u'.codePointAt(0),
          prompt: 'do something else',
        };
      }
    },
  {virtual: true},
);

const watch = require('../watch').default;

const nextTick = () => new Promise(res => process.nextTick(res));
const toHex = char => Number(char.charCodeAt(0)).toString(16);

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMapInstances;
  let globalConfig;
  let contexts;
  let stdin;

  beforeEach(() => {
    const config = {roots: [], testPathIgnorePatterns: [], testRegex: ''};
    pipe = {write: jest.fn()};
    globalConfig = {watch: true};
    hasteMapInstances = [{on: () => {}}];
    contexts = [{config}];
    stdin = new MockStdin();
    results = {snapshot: {}};
  });

  it('Correctly passing test path pattern', () => {
    globalConfig.testPathPattern = 'test-*';

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream: pipe,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
  });

  it('Correctly passing test name pattern', () => {
    globalConfig.testNamePattern = 'test-*';

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream: pipe,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
  });

  it('Runs Jest once by default and shows usage', () => {
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = true;

    const ci_watch = require('../watch').default;
    ci_watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream: pipe,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
    expect(pipe.write.mock.calls.reverse()[0]).toMatchSnapshot();
  });

  it('Runs Jest in a non-interactive environment not showing usage', () => {
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = false;

    const ci_watch = require('../watch').default;
    ci_watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream: pipe,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
    expect(pipe.write.mock.calls.reverse()[0]).toMatchSnapshot();
  });

  it('resolves relative to the package root', () => {
    expect(async () => {
      await watch(
        Object.assign({}, globalConfig, {
          rootDir: __dirname,
          watchPlugins: [watchPluginPath],
        }),
        contexts,
        pipe,
        hasteMapInstances,
        stdin,
      );
    }).not.toThrow();
  });

  it('shows prompts for WatchPlugins in alphabetical order', async () => {
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = true;

    const ci_watch = require('../watch').default;
    ci_watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [watchPlugin2Path, watchPluginPath],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    const pipeMockCalls = pipe.write.mock.calls;

    const determiningTestsToRun = pipeMockCalls.findIndex(
      ([c]) => c === 'Determining test suites to run...',
    );

    expect(pipeMockCalls.slice(determiningTestsToRun + 1)).toMatchSnapshot();
  });

  it('shows update snapshot prompt (without interactive)', async () => {
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = true;
    results = {snapshot: {failure: true}};

    const ci_watch = require('../watch').default;
    ci_watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    const pipeMockCalls = pipe.write.mock.calls;

    const determiningTestsToRun = pipeMockCalls.findIndex(
      ([c]) => c === 'Determining test suites to run...',
    );

    expect(pipeMockCalls.slice(determiningTestsToRun + 1)).toMatchSnapshot();
  });

  it('shows update snapshot prompt (with interactive)', async () => {
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = true;
    util.getFailedSnapshotTests = jest.fn(() => ['test.js']);
    results = {snapshot: {failure: true}};

    const ci_watch = require('../watch').default;
    ci_watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    const pipeMockCalls = pipe.write.mock.calls;

    const determiningTestsToRun = pipeMockCalls.findIndex(
      ([c]) => c === 'Determining test suites to run...',
    );

    expect(pipeMockCalls.slice(determiningTestsToRun + 1)).toMatchSnapshot();
  });

  it('allows WatchPlugins to hook into JestHooks', async () => {
    const apply = jest.fn();
    const pluginPath = `${__dirname}/__fixtures__/plugin_path_register`;
    jest.doMock(
      pluginPath,
      () =>
        class WatchPlugin {
          constructor() {
            this.apply = apply;
          }
        },
      {virtual: true},
    );

    watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [pluginPath],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    await nextTick();

    expect(apply).toHaveBeenCalled();
  });

  it('allows WatchPlugins to hook into file system changes', async () => {
    const fileChange = jest.fn();
    const pluginPath = `${__dirname}/__fixtures__/plugin_path_fs_change`;
    jest.doMock(
      pluginPath,
      () =>
        class WatchPlugin {
          apply(jestHooks) {
            jestHooks.fileChange(fileChange);
          }
        },
      {virtual: true},
    );

    watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [pluginPath],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    expect(fileChange).toHaveBeenCalledWith({
      projects: [
        {
          config: contexts[0].config,
          testPaths: ['./path/to/file1-test.js', './path/to/file2-test.js'],
        },
      ],
    });
  });

  it('triggers enter on a WatchPlugin when its key is pressed', async () => {
    const run = jest.fn(() => Promise.resolve());
    const pluginPath = `${__dirname}/__fixtures__/plugin_path`;
    jest.doMock(
      pluginPath,
      () =>
        class WatchPlugin1 {
          constructor() {
            this.run = run;
          }
          getUsageInfo() {
            return {
              key: 's'.codePointAt(0),
              prompt: 'do nothing',
            };
          }
        },
      {virtual: true},
    );

    watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [pluginPath],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    stdin.emit(Number('s'.charCodeAt(0)).toString(16));

    await nextTick();

    expect(run).toHaveBeenCalled();
  });

  it('prevents Jest from handling keys when active and returns control when end is called', async () => {
    let resolveShowPrompt;
    const run = jest.fn(() => new Promise(res => (resolveShowPrompt = res)));
    const pluginPath = `${__dirname}/__fixtures__/plugin_path_1`;
    jest.doMock(
      pluginPath,
      () =>
        class WatchPlugin1 {
          constructor() {
            this.run = run;
          }
          onKey() {}
          getUsageInfo() {
            return {
              key: 's'.codePointAt(0),
              prompt: 'do nothing',
            };
          }
        },
      {virtual: true},
    );

    const showPrompt2 = jest.fn(() => Promise.resolve());
    const pluginPath2 = `${__dirname}/__fixtures__/plugin_path_2`;
    jest.doMock(
      pluginPath2,
      () =>
        class WatchPlugin1 {
          constructor() {
            this.run = showPrompt2;
          }
          onKey() {}
          getUsageInfo() {
            return {
              key: 'z'.codePointAt(0),
              prompt: 'also do nothing',
            };
          }
        },
      {virtual: true},
    );

    watch(
      Object.assign({}, globalConfig, {
        rootDir: __dirname,
        watchPlugins: [pluginPath, pluginPath2],
      }),
      contexts,
      pipe,
      hasteMapInstances,
      stdin,
    );

    stdin.emit(Number('s'.charCodeAt(0)).toString(16));
    await nextTick();
    expect(run).toHaveBeenCalled();
    stdin.emit(Number('z'.charCodeAt(0)).toString(16));
    await nextTick();
    expect(showPrompt2).not.toHaveBeenCalled();
    await resolveShowPrompt();
    stdin.emit(Number('z'.charCodeAt(0)).toString(16));
    expect(showPrompt2).toHaveBeenCalled();
  });

  it('Pressing "o" runs test in "only changed files" mode', () => {
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.O);

    expect(runJestMock).toBeCalled();
    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      onlyChanged: true,
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "a" runs test in "watch all" mode', () => {
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    runJestMock.mockReset();

    stdin.emit(KEYS.A);

    expect(runJestMock).toBeCalled();
    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      onlyChanged: false,
      watch: false,
      watchAll: true,
    });
  });

  it('Pressing "ENTER" reruns the tests', () => {
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    expect(runJestMock).toHaveBeenCalledTimes(1);
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toHaveBeenCalledTimes(2);
  });

  it('Pressing "t" reruns the tests in "test name pattern" mode', async () => {
    const hooks = new JestHooks();

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin, hooks);
    runJestMock.mockReset();

    stdin.emit(KEYS.T);
    ['t', 'e', 's', 't'].map(toHex).forEach(key => stdin.emit(key));
    stdin.emit(KEYS.ENTER);
    await nextTick();

    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      testNamePattern: 'test',
      testPathPattern: '',
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "p" reruns the tests in "filename pattern" mode', async () => {
    const hooks = new JestHooks();

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin, hooks);
    runJestMock.mockReset();

    stdin.emit(KEYS.P);
    ['f', 'i', 'l', 'e'].map(toHex).forEach(key => stdin.emit(key));
    stdin.emit(KEYS.ENTER);
    await nextTick();

    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      testNamePattern: '',
      testPathPattern: 'file',
      watch: true,
      watchAll: false,
    });
  });

  it('Can combine "p" and "t" filters', async () => {
    const hooks = new JestHooks();

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin, hooks);
    runJestMock.mockReset();

    stdin.emit(KEYS.P);
    ['f', 'i', 'l', 'e'].map(toHex).forEach(key => stdin.emit(key));
    stdin.emit(KEYS.ENTER);
    await nextTick();

    stdin.emit(KEYS.T);
    ['t', 'e', 's', 't'].map(toHex).forEach(key => stdin.emit(key));
    stdin.emit(KEYS.ENTER);
    await nextTick();

    expect(runJestMock.mock.calls[1][0].globalConfig).toMatchObject({
      testNamePattern: 'test',
      testPathPattern: 'file',
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "u" reruns the tests in "update snapshot" mode', async () => {
    const hooks = new JestHooks();

    globalConfig.updateSnapshot = 'new';

    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin, hooks);
    runJestMock.mockReset();

    hooks.getEmitter().testRunComplete({snapshot: {failure: true}});

    stdin.emit(KEYS.U);
    await nextTick();

    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      updateSnapshot: 'all',
      watch: true,
      watchAll: false,
    });

    stdin.emit(KEYS.A);

    await nextTick();
    // updateSnapshot is not sticky after a run.
    expect(runJestMock.mock.calls[1][0].globalConfig).toMatchObject({
      updateSnapshot: 'new',
      watch: false,
      watchAll: true,
    });

    results = {snapshot: {failure: true}};

    stdin.emit(KEYS.A);
    await nextTick();

    runJestMock.mockReset();
    stdin.emit(KEYS.U);
    await nextTick();

    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      updateSnapshot: 'all',
      watch: false,
      watchAll: true,
    });
  });

  it('passWithNoTest should be set to true in watch mode', () => {
    globalConfig.passWithNoTests = false;
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);
    globalConfig.passWithNoTests = true;
    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      globalConfig,
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
