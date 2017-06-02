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
  BlockFn,
  HookFn,
  HookType,
  TestFn,
  BlockMode,
  BlockName,
  TestName,
} from '../types';
import {dispatch} from './state';

type THook = (fn: HookFn, timeout?: number) => void;

const describe = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName);
describe.only = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'only');
describe.skip = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'skip');

const _dispatchDescribe = (blockFn, blockName, mode?: BlockMode) => {
  dispatch({blockName, mode, name: 'start_describe_definition'});
  blockFn();
  dispatch({blockName, mode, name: 'finish_describe_definition'});
};

const _addHook = (fn: HookFn, hookType: HookType, timeout: ?number) =>
  dispatch({fn, hookType, name: 'add_hook', timeout});
const beforeEach: THook = (fn, timeout) => _addHook(fn, 'beforeEach', timeout);
const beforeAll: THook = (fn, timeout) => _addHook(fn, 'beforeAll', timeout);
const afterEach: THook = (fn, timeout) => _addHook(fn, 'afterEach', timeout);
const afterAll: THook = (fn, timeout) => _addHook(fn, 'afterAll', timeout);

const test = (testName: TestName, fn?: TestFn, timeout?: number) =>
  dispatch({fn, name: 'add_test', testName, timeout});
const it = test;
test.skip = (testName: TestName, fn?: TestFn, timeout?: number) =>
  dispatch({fn, mode: 'skip', name: 'add_test', testName, timeout});
test.only = (testName: TestName, fn: TestFn, timeout?: number) =>
  dispatch({fn, mode: 'only', name: 'add_test', testName, timeout});

module.exports = {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
