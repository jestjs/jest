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
  AsyncFn,
  BlockMode,
  BlockName,
  DescribeBlock,
  Exception,
  Hook,
  SharedHookType,
  Test,
  TestContext,
  TestFn,
  TestMode,
  TestName,
  TestResults,
} from '../types';

const makeDescribe = (
  name: BlockName,
  parent: ?DescribeBlock,
  mode?: BlockMode,
): DescribeBlock => {
  if (parent && !mode) {
    // If not set explicitly, inherit from the parent describe.
    mode = parent.mode;
  }

  return {
    children: [],
    hooks: [],
    mode,
    name,
    parent,
    tests: [],
  };
};

const makeTest = (
  fn: ?TestFn,
  mode: TestMode,
  name: TestName,
  parent: DescribeBlock,
): Test => {
  if (!fn) {
    mode = 'skip'; // skip test if no fn passed
  } else if (!mode) {
    // if not set explicitly, inherit from its parent describe
    mode = parent.mode;
  }

  return {
    duration: null,
    errors: [],
    fn,
    mode,
    name,
    parent,
    startedAt: null,
    status: null,
  };
};

const getAllHooks = (
  test: Test,
): {[key: 'beforeHooks' | 'afterHooks']: Array<Hook>} => {
  const result = {afterHooks: [], beforeHooks: []};
  let {parent: block} = test;

  do {
    for (const hook of block.hooks) {
      switch (hook.type) {
        case 'beforeEach':
        case 'beforeAll':
          result.beforeHooks.push(hook);
          break;
        case 'afterEach':
        case 'afterAll':
          result.afterHooks.push(hook);
          break;
        default:
          throw new Error(`unexpected hook type: ${hook.type}`);
      }
    }
  } while ((block = block.parent));
  // Before hooks are executed from top to bottom, the opposite of the way
  // we traversed it.
  result.beforeHooks.reverse();
  return result;
};

const SHARED_HOOK_TYPES: Set<SharedHookType> = new Set([
  'beforeAll',
  'afterAll',
]);
// $FlowFixMe flow thinks that Set.has() can only accept the values of enum.
const isSharedHook = (hook: Hook): boolean => SHARED_HOOK_TYPES.has(hook.type);

const callAsyncFn = (
  fn: AsyncFn,
  testContext: TestContext,
  {isHook}: {isHook?: boolean} = {isHook: false},
): Promise<any> => {
  // If this fn accepts `done` callback we return a promise that fullfills as
  // soon as `done` called.
  if (fn.length) {
    return new Promise((resolve, reject) => {
      const done = (reason?: Error | string): void =>
        reason ? reject(reason) : resolve();

      fn.call(testContext, done);
    });
  }

  let returnedValue;
  try {
    returnedValue = fn.call(testContext);
  } catch (error) {
    return Promise.reject(error);
  }

  // If it's a Promise, return it.
  if (returnedValue instanceof Promise) {
    return returnedValue;
  }

  if (!isHook && returnedValue !== void 0) {
    throw new Error(
      `
      test functions can only return Promise or undefined.
      Returned value: ${String(returnedValue)}
      `,
    );
  }

  // Otherwise this test is synchronous, and if it didn't throw it means
  // it passed.
  return Promise.resolve();
};

const getTestDuration = (test: Test): ?number => {
  const {startedAt} = test;
  return startedAt ? Date.now() - startedAt : null;
};

const makeTestResults = (describeBlock: DescribeBlock): TestResults => {
  let testResults = [];
  for (const test of describeBlock.tests) {
    const testPath = [];
    let parent = test;
    do {
      testPath.unshift(parent.name);
    } while ((parent = parent.parent));

    const {status} = test;

    if (!status) {
      console.log(test);
      throw new Error('status should be present after tests are run');
    }
    testResults.push({
      duration: test.duration,
      errors: test.errors.map(_formatError),
      status,
      testPath,
    });
  }

  for (const child of describeBlock.children) {
    testResults = testResults.concat(makeTestResults(child));
  }

  return testResults;
};

// Return a string that identifies the test (concat of parent describe block
// names + test title)
const getTestID = (test: Test) => {
  const titles = [];
  let parent = test;
  do {
    titles.unshift(parent.name);
  } while ((parent = parent.parent));

  titles.shift(); // remove TOP_DESCRIBE_BLOCK_NAME
  return titles.join(' ');
};

const _formatError = (error: ?Exception): string => {
  if (!error) {
    return 'NO ERROR MESSAGE OR STACK TRACE SPECIFIED';
  } else if (error.stack) {
    return error.stack;
  } else if (error.message) {
    return error.message;
  } else {
    return String(error);
  }
};

module.exports = {
  callAsyncFn,
  getAllHooks,
  getTestDuration,
  getTestID,
  isSharedHook,
  makeDescribe,
  makeTest,
  makeTestResults,
};
