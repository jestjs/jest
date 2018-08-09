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
import {dispatch} from './state';

type THook = (fn: HookFn, timeout?: number) => void;

const describe = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName);
describe.only = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'only');
describe.skip = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'skip');

const _dispatchDescribe = (blockFn, blockName, mode?: BlockMode) => {
  dispatch({
    asyncError: new Error(),
    blockName,
    mode,
    name: 'start_describe_definition',
  });
  blockFn();
  dispatch({blockName, mode, name: 'finish_describe_definition'});
};

const _addHook = (fn: HookFn, hookType: HookType, hookFn, timeout: ?number) => {
  const asyncError = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(asyncError, hookFn);
  }
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
      `Invalid first argument, ${testName}. It must be a string.`,
    );
  }
  if (fn === undefined) {
    throw new Error('Missing second argument. It must be a callback function.');
  }
  if (typeof fn !== 'function') {
    throw new Error(
      `Invalid second argument, ${fn}. It must be a callback function.`,
    );
  }

  const asyncError = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(asyncError, test);
  }

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
  const asyncError = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(asyncError, test);
  }

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
  const asyncError = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(asyncError, test);
  }

  return dispatch({
    asyncError,
    fn,
    mode: 'only',
    name: 'add_test',
    testName,
    timeout,
  });
};

test.each = bindEach(test);
test.only.each = bindEach(test.only);
test.skip.each = bindEach(test.skip);

describe.each = bindEach(describe);
describe.only.each = bindEach(describe.only);
describe.skip.each = bindEach(describe.skip);

module.exports = {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
