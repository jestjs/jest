/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  AgentReporter,
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
import * as runGlobalHook from '../runGlobalHook';

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
  })
  .mock('exit-x', () => ({__esModule: true, default: jest.fn()}));
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

const spyRunGlobalHook = jest.spyOn(runGlobalHook, 'default');

beforeEach(() => {
  mockSerialRunner.runTests.mockClear();
  mockParallelRunner.runTests.mockClear();
  spyShouldRunInBand.mockClear();
  spyRunGlobalHook.mockClear();
});

const AGENT_ENV_VARS = [
  'AI_AGENT',
  'AUGMENT_AGENT',
  'CLAUDE_CODE',
  'CLAUDECODE',
  'CODEX_SANDBOX',
  'CODEX_THREAD_ID',
  'CURSOR_AGENT',
  'GEMINI_CLI',
  'GOOSE_PROVIDER',
  'OPENCODE',
  'REPL_ID',
];

describe('reporters', () => {
  const CustomReporter = require('/custom-reporter.js');
  const savedAgentEnv = {};
  const mockWatcher = {
    isInterrupted: jest.fn(() => false),
    isWatchMode: jest.fn(() => false),
    setState: jest.fn(),
  };

  // Helper: createTestScheduler + scheduleTests([]) so reporters are set up.
  const setupScheduler = async config => {
    const scheduler = await createTestScheduler(config, {}, {});
    await scheduler.scheduleTests([], mockWatcher);
    return scheduler;
  };

  beforeEach(() => {
    for (const key of AGENT_ENV_VARS) {
      savedAgentEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    for (const key of AGENT_ENV_VARS) {
      if (savedAgentEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedAgentEnv[key];
      }
    }
  });

  test('works with default value', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: undefined,
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('uses agent reporter when AI agent is detected', async () => {
    process.env.AI_AGENT = '1';
    try {
      await setupScheduler(
        makeGlobalConfig({
          reporters: undefined,
        }),
      );

      expect(AgentReporter).toHaveBeenCalledTimes(1);
      expect(DefaultReporter).toHaveBeenCalledTimes(0);
      expect(SummaryReporter).toHaveBeenCalledTimes(1);
    } finally {
      delete process.env.AI_AGENT;
    }
  });

  test('does not enable any reporters, if empty list is passed', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(0);
  });

  test('sets up default reporters', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [['default', {}]],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('sets up verbose reporter', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [['default', {}]],
        verbose: true,
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(1);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('sets up github actions reporter', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [
          ['default', {}],
          ['github-actions', {}],
        ],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(1);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('sets up notify reporter', async () => {
    await setupScheduler(
      makeGlobalConfig({
        notify: true,
        reporters: [['default', {}]],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(1);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('sets up coverage reporter', async () => {
    await setupScheduler(
      makeGlobalConfig({
        collectCoverage: true,
        reporters: [['default', {}]],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(1);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(1);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('allows enabling summary reporter separately', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [['summary', {}]],
      }),
    );

    expect(DefaultReporter).toHaveBeenCalledTimes(0);
    expect(VerboseReporter).toHaveBeenCalledTimes(0);
    expect(GitHubActionsReporter).toHaveBeenCalledTimes(0);
    expect(NotifyReporter).toHaveBeenCalledTimes(0);
    expect(CoverageReporter).toHaveBeenCalledTimes(0);
    expect(SummaryReporter).toHaveBeenCalledTimes(1);
  });

  test('sets up custom reporter', async () => {
    await setupScheduler(
      makeGlobalConfig({
        reporters: [
          ['default', {}],
          ['/custom-reporter.js', {}],
        ],
      }),
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
      } catch (error) {
        expect(error).toEqual(errorMsg);
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

test('should bail after `n` failures and perform global teardown', async () => {
  const scheduler = await createTestScheduler(
    makeGlobalConfig({bail: 3}),
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
    isWatchMode: () => false,
    setState,
  });
  await mockSerialRunner.runTests.mock.calls[0][3](test, {
    numFailingTests: 3,
    snapshot: {},
    testResults: [{}],
  });
  expect(spyRunGlobalHook.mock.calls[0][0].moduleName).toBe('globalTeardown');
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

test('passes runnerOptions as third argument to runner constructor', async () => {
  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const test = {
    context: {
      config: makeProjectConfig({
        moduleFileExtensions: ['.js'],
        runner: 'jest-runner-serial',
        runnerOptions: {workers: 2},
        transform: [],
      }),
      hasteFS: {
        matchFiles: jest.fn(() => []),
      },
    },
    path: './test/path.js',
  };

  await scheduler.scheduleTests([test], {isInterrupted: jest.fn()});

  const RunnerConstructor = require('jest-runner-serial');
  expect(RunnerConstructor).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    {workers: 2},
  );
});

test('creates separate runner instances for same runner with different options', async () => {
  const RunnerConstructor = require('jest-runner-serial');
  RunnerConstructor.mockClear();

  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const context1 = {
    config: makeProjectConfig({
      moduleFileExtensions: ['.js'],
      runner: 'jest-runner-serial',
      runnerOptions: {mode: 'fast'},
      transform: [],
    }),
    hasteFS: {
      matchFiles: jest.fn(() => []),
    },
  };
  const context2 = {
    config: makeProjectConfig({
      moduleFileExtensions: ['.js'],
      runner: 'jest-runner-serial',
      runnerOptions: {mode: 'slow'},
      transform: [],
    }),
    hasteFS: {
      matchFiles: jest.fn(() => []),
    },
  };
  const test1 = {
    context: context1,
    path: './test/path1.js',
  };
  const test2 = {
    context: context2,
    path: './test/path2.js',
  };

  await scheduler.scheduleTests([test1, test2], {isInterrupted: jest.fn()});

  expect(RunnerConstructor).toHaveBeenCalledTimes(2);
});

test('deduplicates runners with nested options in different key order', async () => {
  const RunnerConstructor = require('jest-runner-serial');
  RunnerConstructor.mockClear();

  const scheduler = await createTestScheduler(makeGlobalConfig(), {}, {});
  const sharedContext = {
    config: makeProjectConfig({
      moduleFileExtensions: ['.js'],
      runner: 'jest-runner-serial',
      runnerOptions: {list: [1, 2, 3], nested: {a: 1, b: 2}},
      transform: [],
    }),
    hasteFS: {
      matchFiles: jest.fn(() => []),
    },
  };
  const test1 = {
    context: sharedContext,
    path: './test/path1.js',
  };
  const test2 = {
    context: sharedContext,
    path: './test/path2.js',
  };

  await scheduler.scheduleTests([test1, test2], {isInterrupted: jest.fn()});

  // Same context = same runner, only instantiated once
  expect(RunnerConstructor).toHaveBeenCalledTimes(1);
  // Verify nested options were passed correctly
  expect(RunnerConstructor).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    {list: [1, 2, 3], nested: {a: 1, b: 2}},
  );
});
