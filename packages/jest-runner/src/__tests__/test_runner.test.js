/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const TestRunner = require('../index');
const {TestWatcher} = require('jest-cli');

let workerFarmMock;

jest.mock('worker-farm', () => {
  const mock = jest.fn(
    (options, worker) =>
      (workerFarmMock = jest.fn((data, callback) =>
        require(worker)(data, callback),
      )),
  );
  mock.end = jest.fn();
  return mock;
});

jest.mock('../test_worker', () => {});

test('injects the rawModuleMap into each worker in watch mode', () => {
  const globalConfig = {maxWorkers: 2, watch: true};
  const config = {rootDir: '/path/'};
  const rawModuleMap = jest.fn();
  const context = {
    config,
    moduleMap: {getRawModuleMap: () => rawModuleMap},
  };
  return new TestRunner(globalConfig)
    .runTests(
      [{context, path: './file.test.js'}, {context, path: './file2.test.js'}],
      new TestWatcher({isWatchMode: globalConfig.watch}),
      () => {},
      () => {},
      () => {},
      {serial: false},
    )
    .then(() => {
      expect(workerFarmMock.mock.calls).toEqual([
        [
          {config, globalConfig, path: './file.test.js', rawModuleMap},
          expect.any(Function),
        ],
        [
          {config, globalConfig, path: './file2.test.js', rawModuleMap},
          expect.any(Function),
        ],
      ]);
    });
});

test('does not inject the rawModuleMap in serial mode', () => {
  const globalConfig = {maxWorkers: 1, watch: false};
  const config = {rootDir: '/path/'};
  const context = {config};

  return new TestRunner(globalConfig)
    .runTests(
      [{context, path: './file.test.js'}, {context, path: './file2.test.js'}],
      new TestWatcher({isWatchMode: globalConfig.watch}),
      () => {},
      () => {},
      () => {},
      {serial: false},
    )
    .then(() => {
      expect(workerFarmMock.mock.calls).toEqual([
        [
          {
            config,
            globalConfig,
            path: './file.test.js',
            rawModuleMap: null,
          },
          expect.any(Function),
        ],
        [
          {
            config,
            globalConfig,
            path: './file2.test.js',
            rawModuleMap: null,
          },
          expect.any(Function),
        ],
      ]);
    });
});
