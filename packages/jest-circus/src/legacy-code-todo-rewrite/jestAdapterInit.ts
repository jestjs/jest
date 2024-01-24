/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as Process from 'process';
import type {JestEnvironment} from '@jest/environment';
import {type JestExpect, jestExpect} from '@jest/expect';
import {
  type AssertionResult,
  type Status,
  type TestFileEvent,
  type TestResult,
  createEmptyTestResult,
} from '@jest/test-result';
import type {Circus, Config, Global} from '@jest/types';
import {formatExecError, formatResultsErrors} from 'jest-message-util';
import type Runtime from 'jest-runtime';
import {
  SnapshotState,
  addSerializer,
  buildSnapshotResolver,
} from 'jest-snapshot';
import globals from '..';
import run from '../run';
import {
  ROOT_DESCRIBE_BLOCK_NAME,
  addEventHandler,
  dispatch,
  getState as getRunnerState,
} from '../state';
import testCaseReportHandler from '../testCaseReportHandler';
import {unhandledRejectionHandler} from '../unhandledRejectionHandler';
import {getTestID} from '../utils';

interface RuntimeGlobals extends Global.TestFrameworkGlobals {
  expect: JestExpect;
}

export const initialize = async ({
  config,
  environment,
  runtime,
  globalConfig,
  localRequire,
  parentProcess,
  sendMessageToJest,
  setGlobalsForRuntime,
  testPath,
}: {
  config: Config.ProjectConfig;
  environment: JestEnvironment;
  runtime: Runtime;
  globalConfig: Config.GlobalConfig;
  localRequire: <T = unknown>(path: string) => T;
  testPath: string;
  parentProcess: typeof Process;
  sendMessageToJest?: TestFileEvent;
  setGlobalsForRuntime: (globals: RuntimeGlobals) => void;
}): Promise<{
  globals: Global.TestFrameworkGlobals;
  snapshotState: SnapshotState;
}> => {
  if (globalConfig.testTimeout) {
    getRunnerState().testTimeout = globalConfig.testTimeout;
  }
  getRunnerState().maxConcurrency = globalConfig.maxConcurrency;

  getRunnerState().randomize = globalConfig.randomize;
  getRunnerState().seed = globalConfig.seed;

  // @ts-expect-error: missing `concurrent` which is added later
  const globalsObject: Global.TestFrameworkGlobals = {
    ...globals,
    fdescribe: globals.describe.only,
    fit: globals.it.only,
    xdescribe: globals.describe.skip,
    xit: globals.it.skip,
    xtest: globals.it.skip,
  };

  addEventHandler(eventHandler);

  if (environment.handleTestEvent) {
    addEventHandler(environment.handleTestEvent.bind(environment));
  }

  jestExpect.setState({expand: globalConfig.expand});

  const runtimeGlobals: RuntimeGlobals = {
    ...globalsObject,
    expect: jestExpect,
  };
  setGlobalsForRuntime(runtimeGlobals);

  if (config.injectGlobals) {
    Object.assign(environment.global, runtimeGlobals);
  }

  await dispatch({
    name: 'setup',
    parentProcess,
    runtimeGlobals,
    testNamePattern: globalConfig.testNamePattern,
  });

  if (config.testLocationInResults) {
    await dispatch({name: 'include_test_location_in_result'});
  }

  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  for (const path of [...config.snapshotSerializers].reverse())
    addSerializer(localRequire(path));

  const snapshotResolver = await buildSnapshotResolver(config, localRequire);
  const snapshotPath = snapshotResolver.resolveSnapshotPath(testPath);
  const snapshotState = new SnapshotState(snapshotPath, {
    expand: globalConfig.expand,
    prettierPath: config.prettierPath,
    rootDir: config.rootDir,
    snapshotFormat: config.snapshotFormat,
    updateSnapshot: globalConfig.updateSnapshot,
  });

  jestExpect.setState({snapshotState, testPath});

  addEventHandler(handleSnapshotStateAfterRetry(snapshotState));
  if (sendMessageToJest) {
    addEventHandler(testCaseReportHandler(testPath, sendMessageToJest));
  }

  addEventHandler(
    unhandledRejectionHandler(
      runtime,
      globalConfig.waitNextEventLoopTurnForUnhandledRejectionEvents,
    ),
  );

  // Return it back to the outer scope (test runner outside the VM).
  return {globals: globalsObject, snapshotState};
};

export const runAndTransformResultsToJestFormat = async ({
  config,
  globalConfig,
  setupAfterEnvPerfStats,
  testPath,
}: {
  config: Config.ProjectConfig;
  globalConfig: Config.GlobalConfig;
  testPath: string;
  setupAfterEnvPerfStats: Config.SetupAfterEnvPerfStats;
}): Promise<TestResult> => {
  const runResult: Circus.RunResult = await run();

  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  const assertionResults: Array<AssertionResult> = runResult.testResults.map(
    testResult => {
      let status: Status;
      if (testResult.status === 'skip') {
        status = 'pending';
        numPendingTests += 1;
      } else if (testResult.status === 'todo') {
        status = 'todo';
        numTodoTests += 1;
      } else if (testResult.errors.length > 0) {
        status = 'failed';
        numFailingTests += 1;
      } else {
        status = 'passed';
        numPassingTests += 1;
      }

      const ancestorTitles = testResult.testPath.filter(
        name => name !== ROOT_DESCRIBE_BLOCK_NAME,
      );
      const title = ancestorTitles.pop();

      return {
        ancestorTitles,
        duration: testResult.duration,
        failing: testResult.failing,
        failureDetails: testResult.errorsDetailed,
        failureMessages: testResult.errors,
        fullName: title
          ? [...ancestorTitles, title].join(' ')
          : ancestorTitles.join(' '),
        invocations: testResult.invocations,
        location: testResult.location,
        numPassingAsserts: testResult.numPassingAsserts,
        retryReasons: testResult.retryReasons,
        startAt: testResult.startedAt,
        status,
        title: testResult.testPath.at(-1)!,
      };
    },
  );

  let failureMessage = formatResultsErrors(
    assertionResults,
    config,
    globalConfig,
    testPath,
  );
  let testExecError;

  if (runResult.unhandledErrors.length > 0) {
    testExecError = {
      message: '',
      stack: runResult.unhandledErrors.join('\n'),
    };
    failureMessage = `${failureMessage || ''}\n\n${runResult.unhandledErrors
      .map(err => formatExecError(err, config, globalConfig))
      .join('\n')}`;
  }

  await dispatch({name: 'teardown'});

  const emptyTestResult = createEmptyTestResult();

  return {
    ...emptyTestResult,
    console: undefined,
    displayName: config.displayName,
    failureMessage,
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    perfStats: {
      ...emptyTestResult.perfStats,
      ...setupAfterEnvPerfStats,
    },
    testExecError,
    testFilePath: testPath,
    testResults: assertionResults,
  };
};

const handleSnapshotStateAfterRetry =
  (snapshotState: SnapshotState) => (event: Circus.Event) => {
    switch (event.name) {
      case 'test_retry': {
        // Clear any snapshot data that occurred in previous test run
        snapshotState.clear();
      }
    }
  };

// Exported for direct access from unit tests.
export const eventHandler = async (event: Circus.Event): Promise<void> => {
  switch (event.name) {
    case 'test_start': {
      jestExpect.setState({
        currentTestName: getTestID(event.test),
        testFailing: event.test.failing,
      });
      break;
    }
    case 'test_done': {
      event.test.numPassingAsserts = jestExpect.getState().numPassingAsserts;
      _addSuppressedErrors(event.test);
      _addExpectedAssertionErrors(event.test);
      break;
    }
  }
};

const _addExpectedAssertionErrors = (test: Circus.TestEntry) => {
  const {isExpectingAssertions} = jestExpect.getState();
  const failures = jestExpect.extractExpectedAssertionsErrors();
  if (isExpectingAssertions && test.errors.length > 0) {
    // Only show errors from `expect.hasAssertions()` when no other failure has happened.
    return;
  }
  test.errors.push(...failures.map(failure => failure.error));
};

// Get suppressed errors from ``jest-matchers`` that weren't throw during
// test execution and add them to the test result, potentially failing
// a passing test.
const _addSuppressedErrors = (test: Circus.TestEntry) => {
  const {suppressedErrors} = jestExpect.getState();
  jestExpect.setState({suppressedErrors: []});
  if (suppressedErrors.length > 0) {
    test.errors.push(...suppressedErrors);
  }
};
