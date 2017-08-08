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

const TestScheduler = require('../test_scheduler');
const TestWatcher = require('../test_watcher');
const SummaryReporter = require('../reporters/summary_reporter');

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
jest.mock('../reporters/default_reporter');

test('.addReporter() .removeReporter()', () => {
  const scheduler = new TestScheduler({}, {});
  const reporter = new SummaryReporter();
  scheduler.addReporter(reporter);
  expect(scheduler._dispatcher._reporters).toContain(reporter);
  scheduler.removeReporter(SummaryReporter);
  expect(scheduler._dispatcher._reporters).not.toContain(reporter);
});

describe('_createInBandTestRun()', () => {
  test('injects the rawModuleMap to each the worker in watch mode', () => {
    const globalConfig = {maxWorkers: 2, watch: true};
    const config = {rootDir: '/path/'};
    const rawModuleMap = jest.fn();
    const context = {
      config,
      moduleMap: {getRawModuleMap: () => rawModuleMap},
    };
    const scheduler = new TestScheduler(globalConfig, {});

    return scheduler
      ._createParallelTestRun(
        [{context, path: './file.test.js'}, {context, path: './file2.test.js'}],
        new TestWatcher({isWatchMode: globalConfig.watch}),
        () => {},
        () => {},
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

  test('does not inject the rawModuleMap in non watch mode', () => {
    const globalConfig = {maxWorkers: 1, watch: false};
    const config = {rootDir: '/path/'};
    const context = {config};
    const scheduler = new TestScheduler(globalConfig, {});

    return scheduler
      ._createParallelTestRun(
        [{context, path: './file.test.js'}, {context, path: './file2.test.js'}],
        new TestWatcher({isWatchMode: globalConfig.watch}),
        () => {},
        () => {},
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
});
