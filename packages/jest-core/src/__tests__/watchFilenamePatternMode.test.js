/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import {TestPathPatterns} from '@jest/pattern';
// eslint-disable-next-line import/order
import {KEYS} from 'jest-watcher';

const runJestMock = jest.fn();

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

jest.doMock('chalk', () => new chalk.Instance({level: 0}));

jest.doMock('strip-ansi');
require('strip-ansi').mockImplementation(str => str);

jest.doMock(
  '../runJest',
  () =>
    function () {
      const args = [...arguments];
      const [{onComplete}] = args;
      runJestMock.apply(null, args);

      // Call the callback
      onComplete({snapshot: {}});

      return Promise.resolve();
    },
);

const watch = require('../watch').default;

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const globalConfig = {
  rootDir: '',
  testPathPatterns: new TestPathPatterns([]),
  watch: true,
};

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMapInstances;
  let contexts;
  let stdin;

  beforeEach(() => {
    pipe = {write: jest.fn()};
    hasteMapInstances = [{on: () => {}}];
    contexts = [{config: {}}];
    stdin = new MockStdin();
  });

  it('Pressing "P" enters pattern mode', () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    // Write a enter pattern mode
    stdin.emit('p');
    expect(pipe.write).toHaveBeenCalledWith(' pattern › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    // Write a pattern
    for (const pattern of ['p', '.', '*', '1', '0']) assertPattern(pattern);

    for (const pattern of [KEYS.BACKSPACE, KEYS.BACKSPACE])
      assertPattern(pattern);

    for (const pattern of ['3']) assertPattern(pattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toHaveBeenCalled();

    // globalConfig is updated with the current pattern
    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchSnapshot();
  });

  it('Pressing "c" clears the filters', async () => {
    contexts[0].config = {rootDir: ''};
    watch(globalConfig, contexts, pipe, hasteMapInstances, stdin);

    stdin.emit('p');
    await nextTick();

    for (const key of ['p', '.', '*', '1', '0'].concat(KEYS.ENTER))
      stdin.emit(key);

    stdin.emit('t');
    await nextTick();

    for (const key of ['t', 'e', 's', 't'].concat(KEYS.ENTER)) stdin.emit(key);

    await nextTick();

    stdin.emit('c');
    await nextTick();

    pipe.write.mockReset();
    stdin.emit('p');
    await nextTick();

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
    for (const cb of this._callbacks) cb(key);
  }
}
