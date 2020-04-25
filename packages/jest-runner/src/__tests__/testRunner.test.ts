/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {TestWatcher} from '@jest/core';
import {Config} from '@jest/types';
import TestRunner from '../index';

let mockWorkerFarm;

jest.mock('jest-worker', () =>
  jest.fn(
    worker =>
      (mockWorkerFarm = {
        end: jest.fn().mockResolvedValue({forceExited: false}),
        getStderr: jest.fn(),
        getStdout: jest.fn(),
        worker: jest.fn((data, callback) => require(worker)(data, callback)),
      }),
  ),
);

jest.mock('../testWorker', () => {});

test('injects the serializable module map into each worker in watch mode', async () => {
  const globalConfig = {maxWorkers: 2, watch: true};
  const config = {rootDir: '/path/'};
  const serializableModuleMap = jest.fn();
  const runContext = {};
  const context = {
    config,
    moduleMap: {toJSON: () => serializableModuleMap},
  };

  await new TestRunner(globalConfig).runTests(
    [
      {context, path: './file.test.js'},
      {context, path: './file2.test.js'},
    ],
    new TestWatcher({isWatchMode: globalConfig.watch}),
    () => {},
    () => {},
    () => {},
    {serial: false},
  );

  expect(mockWorkerFarm.worker.mock.calls).toEqual([
    [
      {
        config,
        context: runContext,
        globalConfig,
        path: './file.test.js',
      },
    ],
    [
      {
        config,
        context: runContext,
        globalConfig,
        path: './file2.test.js',
      },
    ],
  ]);
});

test('assign process.env.JEST_WORKER_ID = 1 when in runInBand mode', async () => {
  const globalConfig = {maxWorkers: 1, watch: false};
  const config = {rootDir: '/path/'};
  const context = {config};

  await new TestRunner(globalConfig).runTests(
    [{context, path: './file.test.js'}],
    new TestWatcher({isWatchMode: globalConfig.watch}),
    () => {},
    () => {},
    () => {},
    {serial: true},
  );

  expect(process.env.JEST_WORKER_ID).toBe('1');
});

test('put absolute path to test file in process.env.JEST_TEST_PATH', async () => {
  const globalConfig = {maxWorkers: 2} as Config.GlobalConfig;
  const context = {
    config: {} as Config.ProjectConfig,
    hasteFS: null,
    moduleMap: null,
    resolver: null,
  };

  const paths: Array<string> = [];

  await new TestRunner(globalConfig).runTests(
    [
      {context, path: '/path/file.test.js'},
      {context, path: '/path/file2.test.js'},
    ],
    new TestWatcher({isWatchMode: true}),
    async () => {},
    async () => {},
    async () => void paths.push(process.env.JEST_TEST_PATH),
    {serial: true},
  );

  expect(paths).toEqual(['/path/file.test.js', '/path/file2.test.js']);
});
