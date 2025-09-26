/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AsyncLocalStorage} from 'async_hooks';
import pLimit from 'p-limit';
import {jestExpect} from '@jest/expect';
import type {Circus, Global} from '@jest/types';
import {invariant} from 'jest-util';
import shuffleArray, {
  type RandomNumberGenerator,
  rngBuilder,
} from './shuffleArray';
import {dispatch, getState} from './state';
import {RETRY_IMMEDIATELY, RETRY_TIMES, WAIT_BEFORE_RETRY} from './types';
import {
  callAsyncCircusFn,
  getAllHooksForDescribe,
  getEachHooksForTest,
  getTestID,
  makeRunResult,
} from './utils';

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout} = globalThis;

const testNameStorage = new AsyncLocalStorage<string>();

const run = async (): Promise<Circus.RunResult> => {
  const {rootDescribeBlock, seed, randomize} = getState();
  jestExpect.setState({
    currentConcurrentTestName: () => testNameStorage.getStore(),
  });
  const rng = randomize ? rngBuilder(seed) : undefined;
  await dispatch({name: 'run_start'});
  await _runTestsForDescribeBlock(rootDescribeBlock, rng);
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
  rng: RandomNumberGenerator | undefined,
) => {
  await dispatch({describeBlock, name: 'run_describe_start'});
  const {beforeAll, afterAll} = getAllHooksForDescribe(describeBlock);

  const isSkipped = describeBlock.mode === 'skip';

  if (!isSkipped) {
    for (const hook of beforeAll) {
      await _callCircusHook({describeBlock, hook});
    }
  }

  // Tests that fail and are retried we run after other tests
  const retryTimes =
    Number.parseInt((globalThis as Global.Global)[RETRY_TIMES] as string, 10) ||
    0;
  const hasRetryTimes = retryTimes > 0;

  const waitBeforeRetry =
    Number.parseInt(
      (globalThis as Global.Global)[WAIT_BEFORE_RETRY] as string,
      10,
    ) || 0;

  const retryImmediately: boolean =
    ((globalThis as Global.Global)[RETRY_IMMEDIATELY] as any) || false;

  const deferredRetryTests: Array<Circus.TestEntry> = [];

  if (rng) {
    describeBlock.children = shuffleArray(describeBlock.children, rng);
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
    return testNameStorage.run(getTestID(child), async () => {
      await _runTest(child, isSkipped);
      await handleRetry(child, hasErrorsBeforeTestRun, hasRetryTimes);
    });
  };

  for (const child of children) {
    switch (child.type) {
      case 'describeBlock': {
        await _runTestsForDescribeBlock(child, rng);
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
      await _callCircusHook({describeBlock, hook});
    }
  }

  await dispatch({describeBlock, name: 'run_describe_finish'});
};

const _runTest = async (
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
}): Promise<void> => {
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
};

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
