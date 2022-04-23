/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  CoverageReporter,
  DefaultReporter,
  GitHubActionsReporter,
  NotifyReporter,
  SummaryReporter,
  VerboseReporter,
} from '@jest/reporters';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {createTestScheduler} from '../TestScheduler';
import * as testSchedulerHelper from '../testSchedulerHelper';

jest
  .mock('ci-info', () => ({GITHUB_ACTIONS: true}))
  .mock('@jest/reporters')
  .mock(
    '/custom-reporter.js',
    () =>
      jest.fn(() => ({
        onTestStart() {},
      })),
    {virtual: true},
  );

const mockSerialRunner = {
  isSerial: true,
  runTests: jest.fn(),
};
jest.mock('jest-runner-serial', () => jest.fn(() => mockSerialRunner), {
  virtual: true,
});

const mockParallelRunner = {
  runTests: jest.fn(),
};
jest.mock('jest-runner-parallel', () => jest.fn(() => mockParallelRunner), {
  virtual: true,
});

const spyShouldRunInBand = jest.spyOn(testSchedulerHelper, 'shouldRunInBand');

beforeEach(() => {
  mockSerialRunner.runTests.mockClear();
  mockParallelRunner.runTests.mockClear();
  spyShouldRunInBand.mockClear();
});

describe('reporters', () => {
  const CustomReporter = require('/custom-reporter.js');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('works with default value', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: undefined,
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('does not enable any reporters, if empty list is passed', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(0);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(0);
  });

  test('sets up default reporters', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [['default', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('sets up verbose reporter', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [['default', {}]],
        verbose: true,
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(0);
    expect(VerboseReporter).toBeCalledTimes(1);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('sets up github actions reporter', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [
          ['default', {}],
          ['github-actions', {}],
        ],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(1);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('sets up notify reporter', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        notify: true,
        reporters: [['default', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(1);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('sets up coverage reporter', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        collectCoverage: true,
        reporters: [['default', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(1);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('allows enabling summary reporter separately', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [['summary', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(0);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
  });

  test('sets up custom reporter', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [
          ['default', {}],
          ['/custom-reporter.js', {}],
        ],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toBeCalledTimes(1);
    expect(VerboseReporter).toBeCalledTimes(0);
    expect(GitHubActionsReporter).toBeCalledTimes(0);
    expect(NotifyReporter).toBeCalledTimes(0);
    expect(CoverageReporter).toBeCalledTimes(0);
    expect(SummaryReporter).toBeCalledTimes(1);
    expect(CustomReporter).toBeCalledTimes(1);
  });
});

test('.addReporter() .removeReporter()', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const reporter = new SummaryReporter();
  scheduler.addReporter(reporter);
  expect(scheduler._dispatcher._reporters).toContain(reporter);
  scheduler.removeReporter(SummaryReporter);
  expect(scheduler._dispatcher._reporters).not.toContain(reporter);
});

test('schedule tests run in parallel per default', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        runner: 'jest-runner-parallel',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };
  const tests = [test, test];

  await scheduler.scheduleTests(tests, {isInterrupted: jest.fn()});

  expect(mockParallelRunner.runTests).toHaveBeenCalled();
  expect(mockParallelRunner.runTests.mock.calls[0][5].serial).toBeFalsy();
});

test('schedule tests run in serial if the runner flags them', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        runner: 'jest-runner-serial',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };

  const tests = [test, test];
  await scheduler.scheduleTests(tests, {isInterrupted: jest.fn()});

  expect(mockSerialRunner.runTests).toHaveBeenCalled();
  expect(mockSerialRunner.runTests.mock.calls[0][5].serial).toBeTruthy();
});

test('should bail after `n` failures', async () => {
  const scheduler = await createTestScheduler(
    makeGlobalConfig({bail: 2}),
    {},
    {},
  );
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        rootDir: './',
        runner: 'jest-runner-serial',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };

  const tests = [test];
  const setState = jest.fn();
  await scheduler.scheduleTests(tests, {
    isInterrupted: jest.fn(),
    isWatchMode: () => true,
    setState,
  });
  await mockSerialRunner.runTests.mock.calls[0][3](test, {
    numFailingTests: 2,
    snapshot: {},
    testResults: [{}],
  });
  expect(setState).toBeCalledWith({interrupted: true});
});

test('should not bail if less than `n` failures', async () => {
  const scheduler = await createTestScheduler(
    makeGlobalConfig({bail: 2}),
    {},
    {},
  );
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        rootDir: './',
        runner: 'jest-runner-serial',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };

  const tests = [test];
  const setState = jest.fn();
  await scheduler.scheduleTests(tests, {
    isInterrupted: jest.fn(),
    isWatchMode: () => true,
    setState,
  });
  await mockSerialRunner.runTests.mock.calls[0][3](test, {
    numFailingTests: 1,
    snapshot: {},
    testResults: [{}],
  });
  expect(setState).not.toBeCalled();
});

test('should set runInBand to run in serial', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        runner: 'jest-runner-parallel',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };
  const tests = [test, test];

  spyShouldRunInBand.mockReturnValue(true);

  await scheduler.scheduleTests(tests, {isInterrupted: jest.fn()});

  expect(spyShouldRunInBand).toHaveBeenCalled();
  expect(mockParallelRunner.runTests).toHaveBeenCalled();
  expect(mockParallelRunner.runTests.mock.calls[0][5].serial).toBeTruthy();
});

test('should set runInBand to not run in serial', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        runner: 'jest-runner-parallel',
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };
  const tests = [test, test];

  spyShouldRunInBand.mockReturnValue(false);

  await scheduler.scheduleTests(tests, {isInterrupted: jest.fn()});

  expect(spyShouldRunInBand).toHaveBeenCalled();
  expect(mockParallelRunner.runTests).toHaveBeenCalled();
  expect(mockParallelRunner.runTests.mock.calls[0][5].serial).toBeFalsy();
});
