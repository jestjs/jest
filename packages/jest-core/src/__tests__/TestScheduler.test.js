/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import * as transform from '@jest/transform';
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
  )
  .mock('@jest/transform', () => {
    return {
      __esModule: true,
      ...jest.requireActual('@jest/transform'),
    };
  });
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

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('does not enable any reporters, if empty list is passed', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(0);
  });

  test('sets up default reporters', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [['default', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
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

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(1);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
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

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(1);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
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

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(1);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
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

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(1);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('allows enabling summary reporter separately', async () => {
    await createTestScheduler(
      makeGlobalConfig({
        reporters: [['summary', {}]],
      }),
      {},
      {},
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
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

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
    expect(CustomReporter).toHaveBeenCalledTimes(1);
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

describe('scheduleTests should always dispatch runStart and runComplete events', () => {
  const mockReporter = {
    onRunComplete: jest.fn(),
    onRunStart: jest.fn(),
  };

  const errorMsg = 'runtime-error';
  let scheduler, t;

  beforeEach(async () => {
    mockReporter.onRunStart.mockClear();
    mockReporter.onRunComplete.mockClear();

    t = {
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

    scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
    scheduler.addReporter(mockReporter);
  });

  test('during normal run', async () => {
    expect.hasAssertions();
    const result = await scheduler.scheduleTests([t], {
      isInterrupted: jest.fn(),
      isWatchMode: () => true,
      setState: jest.fn(),
    });

    expect(result.numTotalTestSuites).toBe(1);

    expect(mockReporter.onRunStart).toHaveBeenCalledTimes(1);
    expect(mockReporter.onRunComplete).toHaveBeenCalledTimes(1);
    const aggregatedResult = mockReporter.onRunComplete.mock.calls[0][1];
    expect(aggregatedResult.runExecError).toBeUndefined();

    expect(aggregatedResult).toEqual(result);
  });
  test.each`
    runtimeError                                  | message
    ${errorMsg}                                   | ${errorMsg}
    ${123}                                        | ${'123'}
    ${new Error(errorMsg)}                        | ${errorMsg}
    ${{message: errorMsg}}                        | ${errorMsg}
    ${{message: errorMsg, stack: 'stack-string'}} | ${errorMsg}
    ${`${errorMsg}\n Require stack:xxxx`}         | ${errorMsg}
  `('with runtime error: $runtimeError', async ({runtimeError, message}) => {
    expect.hasAssertions();

    const spyCreateScriptTransformer = jest.spyOn(
      transform,
      'createScriptTransformer',
    );
    spyCreateScriptTransformer.mockImplementation(async () => {
      throw runtimeError;
    });

    await expect(
      scheduler.scheduleTests([t], {
        isInterrupted: jest.fn(),
        isWatchMode: () => true,
        setState: jest.fn(),
      }),
    ).rejects.toEqual(runtimeError);

    expect(mockReporter.onRunStart).toHaveBeenCalledTimes(1);
    expect(mockReporter.onRunComplete).toHaveBeenCalledTimes(1);
    const aggregatedResult = mockReporter.onRunComplete.mock.calls[0][1];
    expect(aggregatedResult.runExecError.message).toEqual(message);
    expect(aggregatedResult.runExecError.stack.length).toBeGreaterThan(0);

    spyCreateScriptTransformer.mockRestore();
  });
  test.each`
    watchMode | isInterrupted | hasExecError
    ${false}  | ${false}      | ${true}
    ${true}   | ${false}      | ${true}
    ${true}   | ${true}       | ${false}
  `(
    'with runner exception: watchMode=$watchMode, isInterrupted=$isInterrupted',
    async ({watchMode, isInterrupted, hasExecError}) => {
      expect.hasAssertions();

      mockSerialRunner.runTests.mockImplementation(() => {
        throw errorMsg;
      });

      try {
        const result = await scheduler.scheduleTests([t], {
          isInterrupted: () => isInterrupted,
          isWatchMode: () => watchMode,
          setState: jest.fn(),
        });
        if (hasExecError) {
          throw new Error('should throw exception');
        }
        expect(result.runExecError).toBeUndefined();
      } catch (e) {
        expect(e).toEqual(errorMsg);
      }

      expect(mockReporter.onRunStart).toHaveBeenCalledTimes(1);
      expect(mockReporter.onRunComplete).toHaveBeenCalledTimes(1);

      const aggregatedResult = mockReporter.onRunComplete.mock.calls[0][1];
      if (hasExecError) {
        expect(aggregatedResult.runExecError.message).toEqual(errorMsg);
        expect(aggregatedResult.runExecError.stack.length).toBeGreaterThan(0);
      } else {
        expect(aggregatedResult.runExecError).toBeUndefined();
      }

      mockSerialRunner.runTests.mockReset();
    },
  );
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
  expect(setState).toHaveBeenCalledWith({interrupted: true});
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
  expect(setState).not.toHaveBeenCalled();
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
