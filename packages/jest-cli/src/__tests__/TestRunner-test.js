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

// Checking for the method _addCustomReporters
// Custom reporters used here are the reporters within the package
// No extra reporters are included to be used
describe('_addCustomReporters', () => {
  // Paths for the given reporters
  const SUMMARY_REPORTER_PATH = './reporters/SummaryReporter.js';
  const VERBOSE_REPORTER_PATH = './reporters/VerboseReporter.js';
  const DEFAULT_REPORTER_PATH = './reporters/DefaultReporter.js';

  // Requiring constructors of the given reporters
  // to check against the reporters added
  const summaryReporter = require('.' + SUMMARY_REPORTER_PATH);
  const verboseReporter = require('.' + VERBOSE_REPORTER_PATH);
  const defaultReporter = require('.' + DEFAULT_REPORTER_PATH);

  let runner;

  beforeEach(() => {
    runner = new TestRunner({}, {}, {});

    // Removing all the reporters we previously have in the 
    // Dispatcher. Helps in removing inconsistencies in Tests.
    runner._dispatcher._reporters = [];
  });

  test('adds reporter using 2D Array format', () => {
    const reporters = [
      [SUMMARY_REPORTER_PATH, {}],
    ];

    expect(runner._dispatcher._reporters).toHaveLength(0);
    expect(runner._dispatcher._reporters[0]).toBeUndefined();

    runner._addCustomReporters(reporters);

    expect(runner._dispatcher._reporters).toHaveLength(1);
    expect(runner._dispatcher._reporters.pop()).toBeInstanceOf(summaryReporter);
  });

  test('adds reporter using 2D syntax with no configuration object', () => {
    const reporters = [
      [SUMMARY_REPORTER_PATH],
    ];

    runner._addCustomReporters(reporters);

    expect(runner._dispatcher._reporters).toHaveLength(1);
    expect(runner._dispatcher._reporters.pop()).toBeInstanceOf(SummaryReporter);
  });

  test('adds reporter using string syntax (no custom configuration)', () => {
    const reporters = [
      SUMMARY_REPORTER_PATH,
    ];

    runner._addCustomReporters(reporters);

    expect(runner._dispatcher._reporters).toHaveLength(1);
    expect(runner._dispatcher._reporters.pop()).toBeInstanceOf(summaryReporter);
  });

  test('adds two reporters with variable format', () => {
    const reporters = [
      VERBOSE_REPORTER_PATH,
      [DEFAULT_REPORTER_PATH, {}],
    ];
    runner._addCustomReporters(reporters);

    expect(runner._dispatcher._reporters).toHaveLength(2);

    expect(runner._dispatcher._reporters[0]).toBeInstanceOf(verboseReporter);
    expect(runner._dispatcher._reporters[1]).toBeInstanceOf(defaultReporter);
  });

  test('throws on invalid file path', () => {
    const reporters = [
      ['ohthisisnotgoingtobearealpath.sadfslj', {}],
    ];

    const addInvalidReporters = () => {
      runner._addCustomReporters(reporters);    
    };

    expect(addInvalidReporters).toThrow();
    expect(addInvalidReporters).toThrow(/Cannot find module/);
    expect(runner._dispatcher._reporters).toHaveLength(0);
  });

  test('throws on invalid argument to reporter', () => {
    expect(() => {
      runner._addCustomReporters('This should be an array obviously');
    }).toThrow();
  });
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
