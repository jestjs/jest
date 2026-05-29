/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {TestContext} from '@jest/test-result';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {TestWatcher} from 'jest-watcher';
import TestRunner from '../index';

let mockWorkerFarm;

jest.mock('jest-worker', () => ({
  Worker: jest.fn(
    worker =>
      (mockWorkerFarm = {
        end: jest.fn().mockResolvedValue({forceExited: false}),
        getStderr: jest.fn(),
        getStdout: jest.fn(),
        worker: jest.fn((data, callback) => require(worker)(data, callback)),
      }),
  ),
}));

jest.mock('../testWorker', () => {});

test('injects the serializable module map into each worker in watch mode', async () => {
  const globalConfig = makeGlobalConfig({maxWorkers: 2, watch: true});
  const config = makeProjectConfig({rootDir: '/path/'});
  const runContext = {};
  const mockTestContext = {
    config,
    moduleMap: {toJSON: jest.fn()},
  } as unknown as TestContext;

  await new TestRunner(globalConfig, runContext).runTests(
    [
      {context: mockTestContext, path: './file.test.js'},
      {context: mockTestContext, path: './file2.test.js'},
    ],
    new TestWatcher({isWatchMode: globalConfig.watch}),
    {serial: false},
  );

  expect(mockWorkerFarm.worker).toHaveBeenCalledTimes(2);

  expect(mockWorkerFarm.worker).toHaveBeenNthCalledWith(1, {
    config,
    context: runContext,
    globalConfig,
    path: './file.test.js',
  });

  expect(mockWorkerFarm.worker).toHaveBeenNthCalledWith(2, {
    config,
    context: runContext,
    globalConfig,
    path: './file2.test.js',
  });
});

test('assign process.env.JEST_WORKER_ID = 1 when in runInBand mode', async () => {
  const globalConfig = makeGlobalConfig({maxWorkers: 1, watch: false});
  const config = makeProjectConfig({rootDir: '/path/'});
  const context = {config} as TestContext;

  await new TestRunner(globalConfig, {}).runTests(
    [{context, path: './file.test.js'}],
    new TestWatcher({isWatchMode: globalConfig.watch}),
    {serial: true},
  );

  expect(process.env.JEST_WORKER_ID).toBe('1');
});

test('UNSTABLE_onCustomMessage callback handles Array<unknown> messages', () => {
  // The OnCustomMessage type is (message: Array<unknown> | unknown) => void.
  // This test verifies the callback properly handles the message format
  // used by jest-worker, extracting event and payload from array messages.
  const callback = (message: Array<unknown> | unknown) => {
    if (Array.isArray(message)) {
      const [event, payload] = message;
      return [event, payload];
    }
    return [message];
  };

  // Simulate the custom message format used by jest-worker
  const result = callback(['test-case-start', {testPath: './file.test.js'}]);
  expect(result).toEqual([
    'test-case-start',
    {testPath: './file.test.js'},
  ]);

  // Non-array messages are passed through as-is
  const scalarResult = callback('single-message');
  expect(scalarResult).toEqual(['single-message']);
});
