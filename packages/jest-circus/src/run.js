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
} from 'types/Circus';

import {getState, dispatch} from './state';
import {
  callAsyncFn,
  getAllHooksForDescribe,
  getEachHooksForTest,
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
    _callHook(hook);
  }
  for (const test of describeBlock.tests) {
    await _runTest(test);
  }
  for (const child of describeBlock.children) {
    await _runTestsForDescribeBlock(child);
  }

  for (const hook of afterAll) {
    _callHook(hook);
  }
  dispatch({describeBlock, name: 'run_describe_finish'});
};

const _runTest = async (test: TestEntry): Promise<void> => {
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
    await _callHook(hook, testContext);
  }

  await _callTest(test, testContext);

  for (const hook of afterEach) {
    await _callHook(hook, testContext);
  }
};

const _callHook = (hook: Hook, testContext?: TestContext): Promise<any> => {
  dispatch({hook, name: 'hook_start'});
  const {testTimeout: timeout} = getState();
  return callAsyncFn(hook.fn, testContext, {isHook: true, timeout})
    .then(() => dispatch({hook, name: 'hook_success'}))
    .catch(error => dispatch({error, hook, name: 'hook_failure'}));
};

const _callTest = async (
  test: TestEntry,
  testContext: TestContext,
): Promise<any> => {
  dispatch({name: 'test_start', test});
  const {testTimeout: timeout} = getState();

  if (!test.fn) {
    throw Error(`Tests with no 'fn' should have 'mode' set to 'skipped'`);
  }

  return callAsyncFn(test.fn, testContext, {isHook: false, timeout})
    .then(() => dispatch({name: 'test_success', test}))
    .catch(error => dispatch({error, name: 'test_failure', test}));
};

export default run;
