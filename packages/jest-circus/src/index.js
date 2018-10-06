/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {
  BlockFn,
  HookFn,
  HookType,
  TestFn,
  BlockMode,
  BlockName,
  TestName,
} from 'types/Circus';
import {bind as bindEach} from 'jest-each';
import {ErrorWithStack} from 'jest-util';
import {dispatch} from './state';

type THook = (fn: HookFn, timeout?: number) => void;

const describe = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(
    blockFn,
    blockName,
    new ErrorWithStack(undefined, describe),
  );
describe.only = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(
    blockFn,
    blockName,
    new ErrorWithStack(undefined, describe.only),
    'only',
  );
describe.skip = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(
    blockFn,
    blockName,
    new ErrorWithStack(undefined, describe.skip),
    'skip',
  );

const _dispatchDescribe = (
  blockFn,
  blockName,
  asyncError,
  mode?: BlockMode,
) => {
  if (blockFn === undefined) {
    asyncError.message = `Missing second argument supplied to 'describe'. It must be a callback function.`;
    throw asyncError;
  }
  if (typeof blockFn !== 'function') {
    asyncError.message = `Invalid second argument supplied to 'describe', ${blockFn}. It must be a callback function.`;
    throw asyncError;
  }
  dispatch({
    asyncError,
    blockName,
    mode,
    name: 'start_describe_definition',
  });
  blockFn();
  dispatch({blockName, mode, name: 'finish_describe_definition'});
};

const _addHook = (fn: HookFn, hookType: HookType, hookFn, timeout: ?number) => {
  if (typeof fn !== 'function') {
    throw new Error('Invalid first argument. It must be a callback function.');
  }

  const asyncError = new ErrorWithStack(undefined, hookFn);
  dispatch({asyncError, fn, hookType, name: 'add_hook', timeout});
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

const test = (testName: TestName, fn: TestFn, timeout?: number) => {
  if (typeof testName !== 'string') {
    throw new Error(
      `Invalid first argument supplied to 'it', ${testName}. It must be a string.`,
    );
  }
  if (fn === undefined) {
    throw new Error(
      "Missing second argument supplied to 'it'. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.",
    );
  }
  if (typeof fn !== 'function') {
    throw new Error(
      `Invalid second argument supplied to 'it', ${fn}. It must be a callback function.`,
    );
  }

  const asyncError = new ErrorWithStack(undefined, test);

  return dispatch({
    asyncError,
    fn,
    name: 'add_test',
    testName,
    timeout,
  });
};
const it = test;
test.skip = (testName: TestName, fn?: TestFn, timeout?: number) => {
  const asyncError = new ErrorWithStack(undefined, test);

  return dispatch({
    asyncError,
    fn,
    mode: 'skip',
    name: 'add_test',
    testName,
    timeout,
  });
};
test.only = (testName: TestName, fn: TestFn, timeout?: number) => {
  const asyncError = new ErrorWithStack(undefined, test);

  return dispatch({
    asyncError,
    fn,
    mode: 'only',
    name: 'add_test',
    testName,
    timeout,
  });
};

test.todo = (testName: TestName, ...rest: Array<mixed>) => {
  if (rest.length > 0 || typeof testName !== 'string') {
    throw new ErrorWithStack(
      'Todo must be called with only a description.',
      test.todo,
    );
  }

  const asyncError = new ErrorWithStack(undefined, test);

  return dispatch({
    asyncError,
    fn: () => {},
    mode: 'todo',
    name: 'add_test',
    testName,
    timeout: undefined,
  });
};

test.each = bindEach(test);
test.only.each = bindEach(test.only);
test.skip.each = bindEach(test.skip);

describe.each = bindEach(describe, false);
describe.only.each = bindEach(describe.only, false);
describe.skip.each = bindEach(describe.skip, false);

module.exports = {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
