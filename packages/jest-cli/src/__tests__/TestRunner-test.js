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

const TestRunner = require('../TestRunner');
const TestWatcher = require('../TestWatcher');
const SummaryReporter = require('../reporters/SummaryReporter');

let workerFarmMock;

jest.mock('worker-farm', () => {
  const mock = jest.fn(
    (options, worker) => workerFarmMock = jest.fn(
      (data, callback) => require(worker)(data, callback),
    ),
  );
  mock.end = jest.fn();
  return mock;
});

jest.mock('../TestWorker', () => {});
jest.mock('../reporters/DefaultReporter');

test('.addReporter() .removeReporter()', () => {
  const runner = new TestRunner({}, {}, {});
  const reporter = new SummaryReporter();
  runner.addReporter(reporter);
  expect(runner._dispatcher._reporters).toContain(reporter);
  runner.removeReporter(SummaryReporter);
  expect(runner._dispatcher._reporters).not.toContain(reporter);
});

describe('_createInBandTestRun()', () => {
  test('injects the rawModuleMap to each the worker in watch mode', () => {
    const config = {watch: true};
    const rawModuleMap = jest.fn();
    const hasteContext = {moduleMap: {getRawModuleMap: () => rawModuleMap}};

    const runner = new TestRunner(hasteContext, config, {maxWorkers: 2});

    return runner._createParallelTestRun(
      ['./file-test.js', './file2-test.js'],
      new TestWatcher({isWatchMode: config.watch}),
      () => {},
      () => {},
    ).then(() => {
      expect(workerFarmMock.mock.calls).toEqual([
        [{config, path: './file-test.js', rawModuleMap}, jasmine.any(Function)],
        // eslint-disable-next-line max-len
        [{config, path: './file2-test.js', rawModuleMap}, jasmine.any(Function)],
      ]);
    });
  });

  test('does not inject the rawModuleMap in non watch mode', () => {
    const config = {watch: false};

    const runner = new TestRunner({}, config, {maxWorkers: 1});

    return runner._createParallelTestRun(
      ['./file-test.js', './file2-test.js'],
      new TestWatcher({isWatchMode: config.watch}),
      () => {},
      () => {},
    ).then(() => {
      expect(workerFarmMock.mock.calls).toEqual([
        /* eslint-disable max-len */
        [{config, path: './file-test.js', rawModuleMap: null}, jasmine.any(Function)],
        [{config, path: './file2-test.js', rawModuleMap: null}, jasmine.any(Function)],
        /* eslint-enable max-len */
      ]);
    });
  });
});

