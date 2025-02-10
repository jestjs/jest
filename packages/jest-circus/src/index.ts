/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus, Global} from '@jest/types';
import {bind as bindEach} from 'jest-each';
import {ErrorWithStack, convertDescriptorToString, isPromise} from 'jest-util';
import {dispatchSync} from './state';

export {
  setState,
  getState,
  resetState,
  addEventHandler,
  removeEventHandler,
} from './state';
export {default as run} from './run';

type THook = (fn: Circus.HookFn, timeout?: number) => void;
type DescribeFn = (
  blockName: Circus.BlockNameLike,
  blockFn: Circus.BlockFn,
) => void;

const describe = (() => {
  const describe = (blockName: Circus.BlockNameLike, blockFn: Circus.BlockFn) =>
    _dispatchDescribe(blockFn, blockName, describe);
  const only = (blockName: Circus.BlockNameLike, blockFn: Circus.BlockFn) =>
    _dispatchDescribe(blockFn, blockName, only, 'only');
  const skip = (blockName: Circus.BlockNameLike, blockFn: Circus.BlockFn) =>
    _dispatchDescribe(blockFn, blockName, skip, 'skip');

  describe.each = bindEach(describe, false);

  only.each = bindEach(only, false);
  skip.each = bindEach(skip, false);

  describe.only = only;
  describe.skip = skip;

  return describe;
})();

const _dispatchDescribe = (
  blockFn: Circus.BlockFn,
  blockName: Circus.BlockNameLike,
  describeFn: DescribeFn,
  mode?: Circus.BlockMode,
) => {
  const asyncError = new ErrorWithStack(undefined, describeFn);
  if (blockFn === undefined) {
    asyncError.message =
      'Missing second argument. It must be a callback function.';
    throw asyncError;
  }
  if (typeof blockFn !== 'function') {
    asyncError.message = `Invalid second argument, ${blockFn}. It must be a callback function.`;
    throw asyncError;
  }
  try {
    blockName = convertDescriptorToString(blockName);
  } catch (error) {
    asyncError.message = (error as Error).message;
    throw asyncError;
  }

  dispatchSync({
    asyncError,
    blockName,
    mode,
    name: 'start_describe_definition',
  });
  const describeReturn = blockFn();

  if (isPromise(describeReturn)) {
    throw new ErrorWithStack(
      'Returning a Promise from "describe" is not supported. Tests must be defined synchronously.',
      describeFn,
    );
  } else if (describeReturn !== undefined) {
    throw new ErrorWithStack(
      'A "describe" callback must not return a value.',
      describeFn,
    );
  }

  dispatchSync({blockName, mode, name: 'finish_describe_definition'});
};

const _addHook = (
  fn: Circus.HookFn,
  hookType: Circus.HookType,
  hookFn: THook,
  timeout?: number,
) => {
  const asyncError = new ErrorWithStack(undefined, hookFn);

  if (typeof fn !== 'function') {
    asyncError.message =
      'Invalid first argument. It must be a callback function.';

    throw asyncError;
  }

  dispatchSync({asyncError, fn, hookType, name: 'add_hook', timeout});
};

// Hooks have to pass themselves to the HOF in order for us to trim stack traces.
const beforeEach: THook = (fn, timeout) =>
  _addHook(fn, 'beforeEach', beforeEach, timeout);
const beforeAll: THook = (fn, timeout) =>
  _addHook(fn, 'beforeAll', beforeAll, timeout);
const afterEach: THook = (fn, timeout) =>
  _addHook(fn, 'afterEach', afterEach, timeout);
const afterAll: THook = (fn, timeout) =>
  _addHook(fn, 'afterAll', afterAll, timeout);

const test: Global.It = (() => {
  const test = (
    testName: Circus.TestNameLike,
    fn: Circus.TestFn,
    timeout?: number,
  ): void => _addTest(testName, undefined, false, fn, test, timeout);
  const skip = (
    testName: Circus.TestNameLike,
    fn?: Circus.TestFn,
    timeout?: number,
  ): void => _addTest(testName, 'skip', false, fn, skip, timeout);
  const only = (
    testName: Circus.TestNameLike,
    fn: Circus.TestFn,
    timeout?: number,
  ): void => _addTest(testName, 'only', false, fn, test.only, timeout);
  const concurrentTest = (
    testName: Circus.TestNameLike,
    fn: Circus.TestFn,
    timeout?: number,
  ): void => _addTest(testName, undefined, true, fn, concurrentTest, timeout);
  const concurrentOnly = (
    testName: Circus.TestNameLike,
    fn: Circus.TestFn,
    timeout?: number,
  ): void => _addTest(testName, 'only', true, fn, concurrentOnly, timeout);

  const bindFailing = (concurrent: boolean, mode: Circus.TestMode) => {
    type FailingReturn = typeof concurrent extends true
      ? Global.ConcurrentTestFn
      : Global.TestFn;
    const failing: Global.Failing<FailingReturn> = (
      testName: Circus.TestNameLike,
      fn?: Circus.TestFn,
      timeout?: number,
      eachError?: Error,
    ): void =>
      _addTest(
        testName,
        mode,
        concurrent,
        fn,
        failing,
        timeout,
        true,
        eachError,
      );
    failing.each = bindEach(failing, false, true);
    return failing;
  };

  test.todo = (testName: Circus.TestNameLike, ...rest: Array<any>): void => {
    if (rest.length > 0 || typeof testName !== 'string') {
      throw new ErrorWithStack(
        'Todo must be called with only a description.',
        test.todo,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return _addTest(testName, 'todo', false, () => {}, test.todo);
  };

  const _addTest = (
    testName: Circus.TestNameLike,
    mode: Circus.TestMode,
    concurrent: boolean,
    fn: Circus.TestFn | undefined,
    testFn: (
      testName: Circus.TestNameLike,
      fn: Circus.TestFn,
      timeout?: number,
    ) => void,
    timeout?: number,
    failing?: boolean,
    asyncError: Error = new ErrorWithStack(undefined, testFn),
  ) => {
    try {
      testName = convertDescriptorToString(testName);
    } catch (error) {
      asyncError.message = (error as Error).message;
      throw asyncError;
    }

    if (fn === undefined) {
      asyncError.message =
        'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.';

      throw asyncError;
    }
    if (typeof fn !== 'function') {
      asyncError.message = `Invalid second argument, ${fn}. It must be a callback function.`;

      throw asyncError;
    }

    return dispatchSync({
      asyncError,
      concurrent,
      failing: failing === undefined ? false : failing,
      fn,
      mode,
      name: 'add_test',
      testName,
      timeout,
    });
  };

  test.each = bindEach(test);
  only.each = bindEach(only);
  skip.each = bindEach(skip);

  concurrentTest.each = bindEach(concurrentTest, false);
  concurrentOnly.each = bindEach(concurrentOnly, false);

  only.failing = bindFailing(false, 'only');
  skip.failing = bindFailing(false, 'skip');

  test.failing = bindFailing(false);
  test.only = only;
  test.skip = skip;
  test.concurrent = concurrentTest;
  concurrentTest.only = concurrentOnly;
  concurrentTest.skip = skip;
  concurrentTest.failing = bindFailing(true);
  concurrentOnly.failing = bindFailing(true, 'only');

  return test;
})();

const it: Global.It = test;

export type Event = Circus.Event;
export type State = Circus.State;
export {afterAll, afterEach, beforeAll, beforeEach, describe, it, test};
export default {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
