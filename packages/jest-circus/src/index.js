/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
} from 'types/Circus';
import {dispatch} from './state';

const describe = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName);
describe.only = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'only');
describe.skip = (blockName: BlockName, blockFn: BlockFn) =>
  _dispatchDescribe(blockFn, blockName, 'skip');

const _dispatchDescribe = (blockFn, blockName, mode?: BlockMode) => {
  dispatch({blockName, mode, name: 'start_describe_definition'});
  blockFn();
  dispatch({name: 'finish_describe_definition'});
};

const _addHook = (fn: HookFn, hookType: HookType) =>
  dispatch({fn, hookType, name: 'add_hook'});
const beforeEach = (fn: HookFn) => _addHook(fn, 'beforeEach');
const beforeAll = (fn: HookFn) => _addHook(fn, 'beforeAll');
const afterEach = (fn: HookFn) => _addHook(fn, 'afterEach');
const afterAll = (fn: HookFn) => _addHook(fn, 'afterAll');

const test = (testName: TestName, fn?: TestFn) =>
  dispatch({fn, name: 'add_test', testName});
const it = test;
test.skip = (testName: TestName, fn?: TestFn) =>
  dispatch({fn, mode: 'skip', name: 'add_test', testName});
test.only = (testName: TestName, fn: TestFn) =>
  dispatch({fn, mode: 'only', name: 'add_test', testName});

module.exports = {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
