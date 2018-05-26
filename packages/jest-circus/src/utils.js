/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {
  AsyncFn,
  BlockMode,
  BlockName,
  DescribeBlock,
  Exception,
  Hook,
  TestEntry,
  TestContext,
  TestFn,
  TestMode,
  TestName,
  TestResults,
} from 'types/Circus';

export const makeDescribe = (
  name: BlockName,
  parent: ?DescribeBlock,
  mode?: BlockMode,
): DescribeBlock => {
  let _mode = mode;
  if (parent && !mode) {
    // If not set explicitly, inherit from the parent describe.
    _mode = parent.mode;
  }

  return {
    children: [],
    hooks: [],
    mode: _mode,
    name: convertDescriptorToString(name),
    parent,
    tests: [],
  };
};

export const makeTest = (
  fn: ?TestFn,
  mode: TestMode,
  name: TestName,
  parent: DescribeBlock,
  timeout: ?number,
): TestEntry => {
  let _mode = mode;
  if (!mode) {
    // if not set explicitly, inherit from its parent describe
    _mode = parent.mode;
  }

  return {
    duration: null,
    errors: [],
    fn,
    mode: _mode,
    name: convertDescriptorToString(name),
    parent,
    startedAt: null,
    status: null,
    timeout,
  };
};

export const getAllHooksForDescribe = (
  describe: DescribeBlock,
): {[key: 'beforeAll' | 'afterAll']: Array<Hook>} => {
  const result = {afterAll: [], beforeAll: []};

  for (const hook of describe.hooks) {
    switch (hook.type) {
      case 'beforeAll':
        result.beforeAll.push(hook);
        break;
      case 'afterAll':
        result.afterAll.push(hook);
        break;
    }
  }

  return result;
};

export const getEachHooksForTest = (
  test: TestEntry,
): {[key: 'beforeEach' | 'afterEach']: Array<Hook>} => {
  const result = {afterEach: [], beforeEach: []};
  let {parent: block} = test;

  do {
    for (const hook of block.hooks) {
      switch (hook.type) {
        case 'beforeEach':
          // Before hooks are executed from top to bottom, the opposite of the
          // way we traversed it.
          result.beforeEach.unshift(hook);
          break;
        case 'afterEach':
          result.afterEach.push(hook);
          break;
      }
    }
  } while ((block = block.parent));
  return result;
};

const _makeTimeoutMessage = (timeout, isHook) =>
  new Error(
    `Exceeded timeout of ${timeout}ms for a ${
      isHook ? 'hook' : 'test'
    }.\nUse jest.setTimeout(newTimeout) to increase the timeout value, if this is a long-running test.`,
  );

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout, clearTimeout} = global;

export const callAsyncFn = (
  fn: AsyncFn,
  testContext: ?TestContext,
  {
    isHook,
    test,
    timeout,
  }: {isHook?: ?boolean, test?: TestEntry, timeout: number},
): Promise<mixed> => {
  let timeoutID;

  return new Promise((resolve, reject) => {
    timeoutID = setTimeout(
      () => reject(_makeTimeoutMessage(timeout, isHook)),
      timeout,
    );

    // If this fn accepts `done` callback we return a promise that fullfills as
    // soon as `done` called.
    if (fn.length) {
      const done = (reason?: Error | string): void =>
        reason ? reject(reason) : resolve();

      return fn.call(testContext, done);
    }

    let returnedValue;
    try {
      returnedValue = fn.call(testContext);
    } catch (error) {
      return reject(error);
    }

    // If it's a Promise, return it. Test for an object with a `then` function
    // to support custom Promise implementations.
    if (
      typeof returnedValue === 'object' &&
      returnedValue !== null &&
      typeof returnedValue.then === 'function'
    ) {
      return returnedValue.then(resolve, reject);
    }

    if (!isHook && returnedValue !== void 0) {
      return reject(
        new Error(
          `
      test functions can only return Promise or undefined.
      Returned value: ${String(returnedValue)}
      `,
        ),
      );
    }

    // Otherwise this test is synchronous, and if it didn't throw it means
    // it passed.
    return resolve();
  })
    .then(() => {
      // If timeout is not cleared/unrefed the node process won't exit until
      // it's resolved.
      timeoutID.unref && timeoutID.unref();
      clearTimeout(timeoutID);
    })
    .catch(error => {
      timeoutID.unref && timeoutID.unref();
      clearTimeout(timeoutID);
      throw error;
    });
};

export const getTestDuration = (test: TestEntry): ?number => {
  const {startedAt} = test;
  return startedAt ? Date.now() - startedAt : null;
};

export const makeTestResults = (describeBlock: DescribeBlock): TestResults => {
  let testResults = [];
  for (const test of describeBlock.tests) {
    const testPath = [];
    let parent = test;
    do {
      testPath.unshift(parent.name);
    } while ((parent = parent.parent));

    const {status} = test;

    if (!status) {
      throw new Error('Status should be present after tests are run.');
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
export const getTestID = (test: TestEntry) => {
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
    return `${String(error)} thrown`;
  }
};

export const addErrorToEachTestUnderDescribe = (
  describeBlock: DescribeBlock,
  error: Exception,
) => {
  for (const test of describeBlock.tests) {
    test.errors.push(error);
  }

  for (const child of describeBlock.children) {
    addErrorToEachTestUnderDescribe(child, error);
  }
};

export const invariant = (condition: *, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

// See: https://github.com/facebook/jest/pull/5154
function convertDescriptorToString(descriptor) {
  if (
    typeof descriptor === 'string' ||
    typeof descriptor === 'number' ||
    descriptor === undefined
  ) {
    return descriptor;
  }

  if (typeof descriptor !== 'function') {
    throw new Error('describe expects a class, function, number, or string.');
  }

  if (descriptor.name !== undefined) {
    return descriptor.name;
  }

  // Fallback for old browsers, pardon Flow
  const stringified = descriptor.toString();
  const typeDescriptorMatch = stringified.match(/class|function/);
  const indexOfNameSpace =
    // $FlowFixMe
    typeDescriptorMatch.index + typeDescriptorMatch[0].length;
  // $FlowFixMe
  const indexOfNameAfterSpace = stringified.search(/\(|\{/, indexOfNameSpace);
  const name = stringified.substring(indexOfNameSpace, indexOfNameAfterSpace);
  return name.trim();
}
