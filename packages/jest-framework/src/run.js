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
  Test,
  TestResults,
  TestContext,
  Hook,
  DescribeBlock,
} from '../types';

const {getState, dispatch} = require('./state');
const {
  callAsyncFn,
  getAllHooks,
  isSharedHook,
  makeTestResults,
} = require('./utils');

const run = async (): Promise<TestResults> => {
  const {topDescribeBlock} = getState();
  dispatch({name: 'run_start'});
  await _runTestsForDescribeBlock(topDescribeBlock);
  dispatch({name: 'run_finish'});
  return makeTestResults(getState().topDescribeBlock);
};

const _runTestsForDescribeBlock = async (describeBlock: DescribeBlock) => {
  dispatch({describeBlock, name: 'run_describe_start'});
  for (const test of describeBlock.tests) {
    await _runTest(test);
  }
  for (const child of describeBlock.children) {
    await _runTestsForDescribeBlock(child);
  }
  dispatch({describeBlock, name: 'run_describe_finish'});
};

const _runTest = async (test: Test): Promise<void> => {
  const testContext = Object.create(null);
  const {afterHooks, beforeHooks} = getAllHooks(test);

  for (const hook of beforeHooks) {
    await callHook(hook, testContext);
  }

  await callTest(test, testContext);

  for (const hook of afterHooks) {
    await callHook(hook, testContext);
  }
};

const callHook = (hook: Hook, testContext: TestContext): Promise<any> => {
  const {sharedHooksThatHaveBeenExecuted} = getState();
  if (isSharedHook(hook) && sharedHooksThatHaveBeenExecuted.has(hook)) {
    return Promise.resolve();
  }

  dispatch({hook, name: 'hook_start'});
  return callAsyncFn(hook.fn, testContext, {isHook: true})
    .then(() => dispatch({hook, name: 'hook_success'}))
    .catch(error => dispatch({error, hook, name: 'hook_failure'}));
};

const callTest = (test: Test, testContext: TestContext): Promise<any> => {
  const isSkipped =
    test.mode === 'skip' ||
    (getState().hasFocusedTests && test.mode !== 'only');

  if (isSkipped) {
    dispatch({name: 'test_skip', test});
    return Promise.resolve();
  }

  dispatch({name: 'test_start', test});
  if (!test.fn) {
    throw Error(`Tests with no 'fn' should have 'mode' set to 'skipped'`);
  }

  return callAsyncFn(test.fn, testContext)
    .then(() => dispatch({name: 'test_success', test}))
    .catch(error => dispatch({error, name: 'test_failure', test}));
};

module.exports = run;
