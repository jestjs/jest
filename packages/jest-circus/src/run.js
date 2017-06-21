/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  TestEntry,
  TestResults,
  TestContext,
  Hook,
  DescribeBlock,
} from '../types';

import {getState, dispatch} from './state';
import {
  callAsyncFn,
  getAllHooksForDescribe,
  getEachHooksForTest,
  invariant,
  makeTestResults,
} from './utils';

const run = async (): Promise<TestResults> => {
  const {rootDescribeBlock} = getState();
  dispatch({name: 'run_start'});
  await _runTestsForDescribeBlock(rootDescribeBlock);
  dispatch({name: 'run_finish'});
  return makeTestResults(getState().rootDescribeBlock);
};

const _runTestsForDescribeBlock = async (describeBlock: DescribeBlock) => {
  dispatch({describeBlock, name: 'run_describe_start'});
  const {beforeAll, afterAll} = getAllHooksForDescribe(describeBlock);

  for (const hook of beforeAll) {
    await _callHook({describeBlock, hook});
  }
  for (const test of describeBlock.tests) {
    await _runTest(test);
  }

  for (const child of describeBlock.children) {
    await _runTestsForDescribeBlock(child);
  }

  for (const hook of afterAll) {
    await _callHook({describeBlock, hook});
  }
  dispatch({describeBlock, name: 'run_describe_finish'});
};

const _runTest = async (test: TestEntry): Promise<void> => {
  dispatch({name: 'test_start', test});
  const testContext = Object.create(null);

  const isSkipped =
    test.mode === 'skip' ||
    (getState().hasFocusedTests && test.mode !== 'only');

  if (isSkipped) {
    dispatch({name: 'test_skip', test});
    return;
  }

  const {afterEach, beforeEach} = getEachHooksForTest(test);

  for (const hook of beforeEach) {
    if (test.errors.length) {
      // If any of the before hooks failed already, we don't run any
      // hooks after that.
      break;
    }
    await _callHook({hook, test, testContext});
  }

  await _callTest(test, testContext);

  for (const hook of afterEach) {
    await _callHook({hook, test, testContext});
  }

  // `afterAll` hooks should not affect test status (pass or fail), because if
  // we had a global `afterAll` hook it would block all existing tests until
  // this hook is executed. So we dispatche `test_done` right away.
  dispatch({name: 'test_done', test});
};

const _callHook = ({
  hook,
  test,
  describeBlock,
  testContext,
}: {
  hook: Hook,
  describeBlock?: DescribeBlock,
  test?: TestEntry,
  testContext?: TestContext,
}): Promise<any> => {
  dispatch({hook, name: 'hook_start'});
  const timeout = hook.timeout || getState().testTimeout;
  return callAsyncFn(hook.fn, testContext, {isHook: true, timeout})
    .then(() => dispatch({describeBlock, hook, name: 'hook_success', test}))
    .catch(error =>
      dispatch({describeBlock, error, hook, name: 'hook_failure', test}),
    );
};

const _callTest = async (
  test: TestEntry,
  testContext: TestContext,
): Promise<void> => {
  dispatch({name: 'test_fn_start', test});
  const timeout = test.timeout || getState().testTimeout;
  invariant(test.fn, `Tests with no 'fn' should have 'mode' set to 'skipped'`);

  if (test.errors.length) {
    // We don't run the test if there's already an error in before hooks.
    return;
  }

  await callAsyncFn(test.fn, testContext, {isHook: false, timeout})
    .then(() => dispatch({name: 'test_fn_success', test}))
    .catch(error => dispatch({error, name: 'test_fn_failure', test}));
};

module.exports = run;
