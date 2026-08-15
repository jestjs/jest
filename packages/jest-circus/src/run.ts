/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import pLimit from 'p-limit';
import {type MatcherState, jestExpect} from '@jest/expect';
import type {Circus, Global} from '@jest/types';
import {invariant} from 'jest-util';
import shuffleArray, {
  type RandomNumberGenerator,
  rngBuilder,
} from './shuffleArray';
import {dispatch, getState} from './state';
import {
  finishDescribeRetryAttempt,
  getTestExecutionContext,
  runInTestExecutionContext,
  startDescribeRetryAttempt,
} from './testExecutionContext';
import {RETRY_IMMEDIATELY, RETRY_TIMES, WAIT_BEFORE_RETRY} from './types';
import {
  addErrorToEachTestUnderDescribe,
  callAsyncCircusFn,
  getAllHooksForDescribe,
  getEachHooksForTest,
  getTestID,
  makeRunResult,
} from './utils';

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout} = globalThis;

type SnapshotRetryCheckpoint = ReturnType<
  MatcherState['snapshotState']['getRetryCheckpoint']
>;

type DescribeRetryAttempt = {
  errorsBeforeAttempt: Map<Circus.TestEntry, number>;
  expectStateBeforeAttempt: {
    currentTestName: string | undefined;
    testFailing: boolean | undefined;
  };
  hasExternalExpectState: boolean;
  processErrorGenerationBeforeAttempt: number;
  snapshotCheckpoint: SnapshotRetryCheckpoint | undefined;
  unhandledErrorsBeforeAttempt: number;
};

type RunContext = {
  insideDescribeRetry: boolean;
  rng: RandomNumberGenerator | undefined;
  shuffledDescribeBlocks: WeakSet<Circus.DescribeBlock>;
};

const run = async (): Promise<Circus.RunResult> => {
  const state = getState();
  const {rootDescribeBlock, seed, randomize} = state;
  jestExpect.setState({
    currentConcurrentTestName: () => {
      const test = getTestExecutionContext()?.test;
      return test ? getTestID(test) : undefined;
    },
  });
  const rng = randomize ? rngBuilder(seed) : undefined;
  await dispatch({name: 'run_start'});
  await _runTestsForDescribeBlock(rootDescribeBlock, {
    insideDescribeRetry: false,
    rng,
    shuffledDescribeBlocks: new WeakSet(),
  });
  await dispatch({name: 'run_finish'});
  return makeRunResult(
    getState().rootDescribeBlock,
    getState().unhandledErrors,
  );
};

function* regroupConcurrentChildren(
  children: Array<Circus.DescribeBlock | Circus.TestEntry>,
) {
  const concurrentTests = children.filter(
    (child): child is Circus.TestEntry =>
      child.type === 'test' && child.concurrent,
  );
  if (concurrentTests.length === 0) {
    yield* children;
    return;
  }
  let collectedConcurrent = false;
  for (const child of children) {
    if (child.type === 'test' && child.concurrent) {
      if (!collectedConcurrent) {
        collectedConcurrent = true;
        yield {tests: concurrentTests, type: 'test-concurrent' as const};
      }
    } else {
      yield child;
    }
  }
}

const _runTestsForDescribeBlock = async (
  describeBlock: Circus.DescribeBlock,
  runContext: RunContext,
): Promise<void> => {
  const state = getState();
  const retryOptions = state.describeRetryOptions.get(describeBlock);
  if (!retryOptions) {
    await _runTestsForDescribeBlockOnce(describeBlock, runContext);
    return;
  }

  let numRetriesAvailable =
    Number.parseInt(String(retryOptions.numRetries), 10) || 0;
  const tests = getTestsForDescribeBlock(describeBlock);
  while (true) {
    const {
      currentTestName,
      expectedAssertionsNumber,
      isExpectingAssertions,
      suppressedErrors,
      testFailing,
    } = jestExpect.getState();
    const retryAttempt: DescribeRetryAttempt = {
      errorsBeforeAttempt: new Map(
        tests.map(test => [test, test.errors.length] as const),
      ),
      expectStateBeforeAttempt: {currentTestName, testFailing},
      hasExternalExpectState:
        expectedAssertionsNumber !== null ||
        isExpectingAssertions ||
        suppressedErrors.length > 0,
      processErrorGenerationBeforeAttempt: state.processErrorGeneration,
      snapshotCheckpoint: jestExpect
        .getState()
        .snapshotState?.getRetryCheckpoint?.(),
      unhandledErrorsBeforeAttempt: state.unhandledErrors.length,
    };
    startDescribeRetryAttempt();
    try {
      await _runTestsForDescribeBlockOnce(describeBlock, {
        ...runContext,
        insideDescribeRetry: true,
      });
    } finally {
      finishDescribeRetryAttempt();
    }

    const hasErrors = hasErrorsAddedDuringAttempt(retryAttempt);
    const nonRetryable =
      retryAttempt.hasExternalExpectState ||
      state.processErrorGeneration >
        retryAttempt.processErrorGenerationBeforeAttempt ||
      state.unhandledErrors.length > retryAttempt.unhandledErrorsBeforeAttempt;
    if (!hasErrors || nonRetryable || numRetriesAvailable <= 0) {
      retryAttempt.snapshotCheckpoint?.commit?.();
      return;
    }

    const logErrorsBeforeRetry = retryOptions.logErrorsBeforeRetry ?? false;
    clearTestErrors(retryAttempt, logErrorsBeforeRetry);
    retryAttempt.snapshotCheckpoint?.restore();
    jestExpect.setState(retryAttempt.expectStateBeforeAttempt);
    await dispatch({describeBlock, name: 'describe_retry'});

    if ((retryOptions.waitBeforeRetry ?? 0) > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, retryOptions.waitBeforeRetry),
      );
    }

    numRetriesAvailable--;
  }
};

const clearTestErrors = (
  retryAttempt: DescribeRetryAttempt,
  logErrorsBeforeRetry: boolean,
): void => {
  for (const [test, errorStart] of retryAttempt.errorsBeforeAttempt) {
    const errors = test.errors.slice(errorStart);
    if (logErrorsBeforeRetry) {
      test.retryReasons.push(...errors);
    }
    test.errors = test.errors.slice(0, errorStart);
  }
};

const hasErrorsAddedDuringAttempt = (
  retryAttempt: DescribeRetryAttempt,
): boolean => {
  for (const [test, errorStart] of retryAttempt.errorsBeforeAttempt) {
    if (test.errors.length > errorStart) {
      return true;
    }
  }
  return false;
};

const getTestsForDescribeBlock = (
  describeBlock: Circus.DescribeBlock,
): Array<Circus.TestEntry> => {
  const tests: Array<Circus.TestEntry> = [];
  const children: Array<Circus.DescribeBlock | Circus.TestEntry> = [
    describeBlock,
  ];

  while (children.length > 0) {
    const child = children.pop();
    if (!child) {
      continue;
    }

    if (child.type === 'describeBlock') {
      for (let index = child.children.length - 1; index >= 0; index--) {
        children.push(child.children[index]);
      }
    } else {
      tests.push(child);
    }
  }
  return tests;
};

const takeNewSuppressedErrors = (
  suppressedErrorsBeforeHook: number,
): Array<Circus.Exception> => {
  const {suppressedErrors} = jestExpect.getState();
  const newSuppressedErrors = suppressedErrors.slice(
    suppressedErrorsBeforeHook,
  );
  if (newSuppressedErrors.length > 0) {
    jestExpect.setState({
      suppressedErrors: suppressedErrors.slice(0, suppressedErrorsBeforeHook),
    });
  }
  return newSuppressedErrors;
};

const _runTestsForDescribeBlockOnce = async (
  describeBlock: Circus.DescribeBlock,
  runContext: RunContext,
) => {
  await dispatch({describeBlock, name: 'run_describe_start'});
  const {beforeAll, afterAll} = getAllHooksForDescribe(describeBlock);

  const isSkipped = describeBlock.mode === 'skip';

  if (!isSkipped) {
    for (const hook of beforeAll) {
      const trackSuppressedErrors = runContext.insideDescribeRetry;
      const suppressedErrorsBeforeHook = trackSuppressedErrors
        ? jestExpect.getState().suppressedErrors.length
        : undefined;
      await _callCircusHook({describeBlock, hook});
      if (suppressedErrorsBeforeHook !== undefined) {
        for (const error of takeNewSuppressedErrors(
          suppressedErrorsBeforeHook,
        )) {
          addErrorToEachTestUnderDescribe(describeBlock, error);
        }
      }
    }
  }

  // Tests that fail and are retried we run after other tests
  const retryTimes =
    Number.parseInt((globalThis as Global.Global)[RETRY_TIMES] as string, 10) ||
    0;
  const hasRetryTimes = retryTimes > 0 && !runContext.insideDescribeRetry;

  const waitBeforeRetry =
    Number.parseInt(
      (globalThis as Global.Global)[WAIT_BEFORE_RETRY] as string,
      10,
    ) || 0;

  const retryImmediately: boolean =
    ((globalThis as Global.Global)[RETRY_IMMEDIATELY] as any) || false;

  const deferredRetryTests: Array<Circus.TestEntry> = [];

  if (runContext.rng && !runContext.shuffledDescribeBlocks.has(describeBlock)) {
    describeBlock.children = shuffleArray(
      describeBlock.children,
      runContext.rng,
    );
    runContext.shuffledDescribeBlocks.add(describeBlock);
  }

  // Regroup concurrent tests as a single "sequential" unit
  const children = regroupConcurrentChildren(describeBlock.children);

  const rerunTest = async (test: Circus.TestEntry) => {
    let numRetriesAvailable = retryTimes;

    while (numRetriesAvailable > 0 && test.errors.length > 0) {
      // Clear errors so retries occur
      await dispatch({name: 'test_retry', test});

      if (waitBeforeRetry > 0) {
        await new Promise(resolve => setTimeout(resolve, waitBeforeRetry));
      }

      await _runTest(test, isSkipped);
      numRetriesAvailable--;
    }
  };

  const handleRetry = async (
    test: Circus.TestEntry,
    hasErrorsBeforeTestRun: boolean,
    hasRetryTimes: boolean,
  ) => {
    // no retry if the test passed or had errors before the test ran
    if (test.errors.length === 0 || hasErrorsBeforeTestRun || !hasRetryTimes) {
      return;
    }

    if (!retryImmediately) {
      deferredRetryTests.push(test);
      return;
    }

    // If immediate retry is set, we retry the test immediately after the first run
    await rerunTest(test);
  };
  const runTestWithContext = async (child: Circus.TestEntry) => {
    const hasErrorsBeforeTestRun = child.errors.length > 0;
    await _runTest(child, isSkipped);
    await handleRetry(child, hasErrorsBeforeTestRun, hasRetryTimes);
  };

  for (const child of children) {
    switch (child.type) {
      case 'describeBlock': {
        await _runTestsForDescribeBlock(child, runContext);
        break;
      }
      case 'test': {
        await runTestWithContext(child);
        break;
      }
      case 'test-concurrent': {
        await dispatch({
          describeBlock,
          name: 'concurrent_tests_start',
          tests: child.tests,
        });
        const concurrencyLimiter = pLimit(getState().maxConcurrency);
        const tasks = child.tests.map(concurrentTest =>
          concurrencyLimiter(() => runTestWithContext(concurrentTest)),
        );
        await Promise.all(tasks);
        await dispatch({
          describeBlock,
          name: 'concurrent_tests_end',
          tests: child.tests,
        });
        break;
      }
    }
  }

  // Re-run failed tests n-times if configured
  for (const test of deferredRetryTests) {
    await rerunTest(test);
  }

  if (!isSkipped) {
    for (const hook of afterAll) {
      const trackSuppressedErrors = runContext.insideDescribeRetry;
      const suppressedErrorsBeforeHook = trackSuppressedErrors
        ? jestExpect.getState().suppressedErrors.length
        : undefined;
      await _callCircusHook({describeBlock, hook});
      if (suppressedErrorsBeforeHook !== undefined) {
        for (const error of takeNewSuppressedErrors(
          suppressedErrorsBeforeHook,
        )) {
          getState().unhandledErrors.push(error);
        }
      }
    }
  }

  await dispatch({describeBlock, name: 'run_describe_finish'});
};

const _runTest = async (
  test: Circus.TestEntry,
  parentSkipped: boolean,
): Promise<void> =>
  runInTestExecutionContext({test}, () =>
    _runTestInContext(test, parentSkipped),
  );

const _runTestInContext = async (
  test: Circus.TestEntry,
  parentSkipped: boolean,
): Promise<void> => {
  await dispatch({name: 'test_start', test});
  const testContext = Object.create(null);
  const {hasFocusedTests, testNamePattern} = getState();

  const isSkipped =
    parentSkipped ||
    test.mode === 'skip' ||
    (hasFocusedTests && test.mode === undefined) ||
    (testNamePattern && !testNamePattern.test(getTestID(test)));

  if (isSkipped) {
    await dispatch({name: 'test_skip', test});
    return;
  }

  if (test.mode === 'todo') {
    await dispatch({name: 'test_todo', test});
    return;
  }

  await dispatch({name: 'test_started', test});

  const {afterEach, beforeEach} = getEachHooksForTest(test);

  for (const hook of beforeEach) {
    if (test.errors.length > 0) {
      // If any of the before hooks failed already, we don't run any
      // hooks after that.
      break;
    }
    await _callCircusHook({hook, test, testContext});
  }

  await _callCircusTest(test, testContext);

  for (const hook of afterEach) {
    await _callCircusHook({hook, test, testContext});
  }

  // `afterAll` hooks should not affect test status (pass or fail), because if
  // we had a global `afterAll` hook it would block all existing tests until
  // this hook is executed. So we dispatch `test_done` right away.
  await dispatch({name: 'test_done', test});
};

const _callCircusHook = async ({
  hook,
  test,
  describeBlock,
  testContext = {},
}: {
  hook: Circus.Hook;
  describeBlock?: Circus.DescribeBlock;
  test?: Circus.TestEntry;
  testContext?: Circus.TestContext;
}): Promise<void> =>
  runInTestExecutionContext({hook, test}, async function _callCircusHook() {
    await dispatch({hook, name: 'hook_start'});
    const timeout = hook.timeout || getState().testTimeout;

    try {
      await callAsyncCircusFn(hook, testContext, {
        isHook: true,
        timeout,
      });
      await dispatch({describeBlock, hook, name: 'hook_success', test});
    } catch (error) {
      await dispatch({describeBlock, error, hook, name: 'hook_failure', test});
    }
  });

const _callCircusTest = async (
  test: Circus.TestEntry,
  testContext: Circus.TestContext,
): Promise<void> => {
  await dispatch({name: 'test_fn_start', test});
  const timeout = test.timeout || getState().testTimeout;
  invariant(test.fn, "Tests with no 'fn' should have 'mode' set to 'skipped'");

  if (test.errors.length > 0) {
    return; // We don't run the test if there's already an error in before hooks.
  }

  try {
    await callAsyncCircusFn(test, testContext, {
      isHook: false,
      timeout,
    });
    if (test.failing) {
      test.asyncError.message =
        'Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.';
      await dispatch({
        error: test.asyncError,
        name: 'test_fn_failure',
        test,
      });
    } else {
      await dispatch({name: 'test_fn_success', test});
    }
  } catch (error) {
    if (test.failing) {
      await dispatch({name: 'test_fn_success', test});
    } else {
      await dispatch({error, name: 'test_fn_failure', test});
    }
  }
};

export default run;
