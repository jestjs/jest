/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import {convertDescriptorToString} from 'jest-util';
import isGeneratorFn from 'is-generator-fn';
import co from 'co';
import dedent = require('dedent');
import StackUtils = require('stack-utils');
import prettyFormat = require('pretty-format');
import {getState} from './state';

const stackUtils = new StackUtils({cwd: 'A path that does not exist'});

export const makeDescribe = (
  name: Circus.BlockName,
  parent?: Circus.DescribeBlock,
  mode?: Circus.BlockMode,
): Circus.DescribeBlock => {
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
  fn: Circus.TestFn | undefined,
  mode: Circus.TestMode,
  name: Circus.TestName,
  parent: Circus.DescribeBlock,
  timeout: number | undefined,
  asyncError: Circus.Exception,
): Circus.TestEntry => ({
  asyncError,
  duration: null,
  errors: [],
  fn,
  invocations: 0,
  mode,
  name: convertDescriptorToString(name),
  parent,
  startedAt: null,
  status: null,
  timeout,
});

// Traverse the tree of describe blocks and return true if at least one describe
// block has an enabled test.
const hasEnabledTest = (describeBlock: Circus.DescribeBlock): boolean => {
  const {hasFocusedTests, testNamePattern} = getState();
  const hasOwnEnabledTests = describeBlock.tests.some(
    test =>
      !(
        test.mode === 'skip' ||
        (hasFocusedTests && test.mode !== 'only') ||
        (testNamePattern && !testNamePattern.test(getTestID(test)))
      ),
  );

  return hasOwnEnabledTests || describeBlock.children.some(hasEnabledTest);
};

type DescribeHooks = {
  beforeAll: Array<Circus.Hook>;
  afterAll: Array<Circus.Hook>;
};

export const getAllHooksForDescribe = (
  describe: Circus.DescribeBlock,
): DescribeHooks => {
  const result: DescribeHooks = {
    afterAll: [],
    beforeAll: [],
  };

  if (hasEnabledTest(describe)) {
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
  }

  return result;
};

type TestHooks = {
  beforeEach: Array<Circus.Hook>;
  afterEach: Array<Circus.Hook>;
};

export const getEachHooksForTest = (test: Circus.TestEntry): TestHooks => {
  const result: TestHooks = {afterEach: [], beforeEach: []};
  let block: Circus.DescribeBlock | undefined | null = test.parent;

  do {
    const beforeEachForCurrentBlock = [];
    // TODO: inline after https://github.com/microsoft/TypeScript/pull/34840 is released
    let hook: Circus.Hook;
    for (hook of block.hooks) {
      switch (hook.type) {
        case 'beforeEach':
          beforeEachForCurrentBlock.push(hook);
          break;
        case 'afterEach':
          result.afterEach.push(hook);
          break;
      }
    }
    // 'beforeEach' hooks are executed from top to bottom, the opposite of the
    // way we traversed it.
    result.beforeEach = [...beforeEachForCurrentBlock, ...result.beforeEach];
  } while ((block = block.parent));
  return result;
};

export const describeBlockHasTests = (
  describe: Circus.DescribeBlock,
): boolean =>
  describe.tests.length > 0 || describe.children.some(describeBlockHasTests);

const _makeTimeoutMessage = (timeout: number, isHook: boolean) =>
  `Exceeded timeout of ${timeout}ms for a ${
    isHook ? 'hook' : 'test'
  }.\nUse jest.setTimeout(newTimeout) to increase the timeout value, if this is a long-running test.`;

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout, clearTimeout} = global;

function checkIsError(error: any): error is Error {
  return !!(error && (error as Error).message && (error as Error).stack);
}

export const callAsyncCircusFn = (
  fn: Circus.AsyncFn,
  testContext: Circus.TestContext | undefined,
  asyncError: Circus.Exception,
  {isHook, timeout}: {isHook?: boolean | null; timeout: number},
): Promise<any> => {
  let timeoutID: NodeJS.Timeout;
  let completed = false;

  return new Promise((resolve, reject) => {
    timeoutID = setTimeout(
      () => reject(_makeTimeoutMessage(timeout, !!isHook)),
      timeout,
    );

    // If this fn accepts `done` callback we return a promise that fulfills as
    // soon as `done` called.
    if (fn.length) {
      let returnedValue: unknown = undefined;
      const done = (reason?: Error | string): void => {
        // We need to keep a stack here before the promise tick
        const errorAtDone = new Error();
        // Use `Promise.resolve` to allow the event loop to go a single tick in case `done` is called synchronously
        Promise.resolve().then(() => {
          if (returnedValue !== undefined) {
            asyncError.message = dedent`
      Test functions cannot both take a 'done' callback and return something. Either use a 'done' callback, or return a promise.
      Returned value: ${prettyFormat(returnedValue, {maxDepth: 3})}
      `;
            return reject(asyncError);
          }

          let errorAsErrorObject: Error;

          if (checkIsError(reason)) {
            errorAsErrorObject = reason;
          } else {
            errorAsErrorObject = errorAtDone;
            errorAtDone.message = `Failed: ${prettyFormat(reason, {
              maxDepth: 3,
            })}`;
          }

          // Consider always throwing, regardless if `reason` is set or not
          if (completed && reason) {
            errorAsErrorObject.message =
              'Caught error after test environment was torn down\n\n' +
              errorAsErrorObject.message;

            throw errorAsErrorObject;
          }

          return reason ? reject(errorAsErrorObject) : resolve();
        });
      };

      returnedValue = fn.call(testContext, done);

      return;
    }

    let returnedValue;
    if (isGeneratorFn(fn)) {
      returnedValue = co.wrap(fn).call({});
    } else {
      try {
        returnedValue = fn.call(testContext);
      } catch (error) {
        reject(error);
        return;
      }
    }

    // If it's a Promise, return it. Test for an object with a `then` function
    // to support custom Promise implementations.
    if (
      typeof returnedValue === 'object' &&
      returnedValue !== null &&
      typeof returnedValue.then === 'function'
    ) {
      returnedValue.then(resolve, reject);
      return;
    }

    if (!isHook && returnedValue !== undefined) {
      reject(
        new Error(
          dedent`
      test functions can only return Promise or undefined.
      Returned value: ${prettyFormat(returnedValue, {maxDepth: 3})}
      `,
        ),
      );
      return;
    }

    // Otherwise this test is synchronous, and if it didn't throw it means
    // it passed.
    resolve();
  })
    .then(() => {
      completed = true;
      // If timeout is not cleared/unrefed the node process won't exit until
      // it's resolved.
      timeoutID.unref && timeoutID.unref();
      clearTimeout(timeoutID);
    })
    .catch(error => {
      completed = true;
      timeoutID.unref && timeoutID.unref();
      clearTimeout(timeoutID);
      throw error;
    });
};

export const getTestDuration = (test: Circus.TestEntry): number | null => {
  const {startedAt} = test;
  return typeof startedAt === 'number' ? Date.now() - startedAt : null;
};

export const makeRunResult = (
  describeBlock: Circus.DescribeBlock,
  unhandledErrors: Array<Error>,
): Circus.RunResult => ({
  testResults: makeTestResults(describeBlock),
  unhandledErrors: unhandledErrors.map(_formatError),
});

const makeTestResults = (
  describeBlock: Circus.DescribeBlock,
): Circus.TestResults => {
  const {includeTestLocationInResult} = getState();
  let testResults: Circus.TestResults = [];
  for (const test of describeBlock.tests) {
    const testPath = [];
    let parent: Circus.TestEntry | Circus.DescribeBlock | undefined = test;
    do {
      testPath.unshift(parent.name);
    } while ((parent = parent.parent));

    const {status} = test;

    if (!status) {
      throw new Error('Status should be present after tests are run.');
    }

    let location = null;
    if (includeTestLocationInResult) {
      const stackLine = test.asyncError.stack.split('\n')[1];
      const parsedLine = stackUtils.parseLine(stackLine);
      if (
        parsedLine &&
        typeof parsedLine.column === 'number' &&
        typeof parsedLine.line === 'number'
      ) {
        location = {
          column: parsedLine.column,
          line: parsedLine.line,
        };
      }
    }

    testResults.push({
      duration: test.duration,
      errors: test.errors.map(_formatError),
      invocations: test.invocations,
      location,
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
export const getTestID = (test: Circus.TestEntry): string => {
  const titles = [];
  let parent: Circus.TestEntry | Circus.DescribeBlock | undefined = test;
  do {
    titles.unshift(parent.name);
  } while ((parent = parent.parent));

  titles.shift(); // remove TOP_DESCRIBE_BLOCK_NAME
  return titles.join(' ');
};

const _formatError = (
  errors?: Circus.Exception | [Circus.Exception | undefined, Circus.Exception],
): string => {
  let error;
  let asyncError;

  if (Array.isArray(errors)) {
    error = errors[0];
    asyncError = errors[1];
  } else {
    error = errors;
    asyncError = new Error();
  }

  if (error) {
    if (error.stack) {
      return error.stack;
    }
    if (error.message) {
      return error.message;
    }
  }

  asyncError.message = `thrown: ${prettyFormat(error, {maxDepth: 3})}`;

  return asyncError.stack;
};

export const addErrorToEachTestUnderDescribe = (
  describeBlock: Circus.DescribeBlock,
  error: Circus.Exception,
  asyncError: Circus.Exception,
): void => {
  for (const test of describeBlock.tests) {
    test.errors.push([error, asyncError]);
  }

  for (const child of describeBlock.children) {
    addErrorToEachTestUnderDescribe(child, error, asyncError);
  }
};

export function invariant(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
