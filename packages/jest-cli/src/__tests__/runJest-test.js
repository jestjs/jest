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

const runJest = require('../runJest');
const TestWatcher = require('../TestWatcher');
const normalizeConfig = require('jest-config').normalize;
const path = require('path');

const skipOnWindows = require('skipOnWindows');
skipOnWindows.suite();

jest.mock('../TestRunner', () => {
  return class TestRunner {
    runTests() {
      return Promise.resolve({
        testResults: ['/path.js'],
      });
    }
  };
});

jest.mock('../SearchSource', () => {
  const SearchSource = require.requireActual('../SearchSource');
  SearchSource.prototype.getTestPaths = function() {
    return Promise.resolve({
      stats: {},
      tests: [
        {
          context: this._context,
          path: '/path.js',
        },
      ],
      total: 1,
    });
  };
  return SearchSource;
});

jest.mock('../TestSequencer', () => {
  const TestSequencer = require.requireActual('../TestSequencer');
  TestSequencer.prototype.sort = jest.fn(tests => tests);
  TestSequencer.prototype.cacheResults = jest.fn();
  return TestSequencer;
});

let config;
let hasteFS;
const maxWorkers = 2;
const rootDir = path.resolve(__dirname, 'test_root');

if (process.platform !== 'win32') {
  beforeEach(() => {
    config = normalizeConfig({
      rootDir,
      roots: [],
    }).config;
    const Runtime = require('jest-runtime');
    return Runtime.createContext(config, {maxWorkers}).then(hasteMap => {
      hasteFS = hasteMap.hasteFS;
    });
  });
}

test('passes updateSnapshot to context.config', async () => {
  const contexts = [
    {
      config,
      hasteFS,
    },
    {
      config: {
        rootDir,
        roots: [],
        testPathIgnorePatterns: [],
      },
      hasteFS,
    },
  ];
  const noop = () => {};
  const argv = {};
  const pipe = process.stdout;
  const testWatcher = new TestWatcher({isWatchMode: true});
  await runJest(
    {
      updateSnapshot: true,
    },
    contexts,
    argv,
    pipe,
    testWatcher,
    noop,
    noop,
  );
  expect(contexts.every(({config}) => config.updateSnapshot)).toBe(true);
});
