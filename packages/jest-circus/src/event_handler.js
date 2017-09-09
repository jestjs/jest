/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {EventHandler} from 'types/Circus';

import {makeDescribe, getTestDuration, makeTest} from './utils';

// To pass this value from Runtime object to state we need to use global[sym]
const TEST_TIMEOUT_SYMBOL = Symbol.for('TEST_TIMEOUT_SYMBOL');

const handler: EventHandler = (event, state): void => {
  switch (event.name) {
    case 'hook_start': {
      break;
    }
    case 'start_describe_definition': {
      const {blockName, mode} = event;
      const {currentDescribeBlock} = state;
      const describeBlock = makeDescribe(blockName, currentDescribeBlock, mode);
      currentDescribeBlock.children.push(describeBlock);
      state.currentDescribeBlock = describeBlock;
      break;
    }
    case 'finish_describe_definition': {
      const {currentDescribeBlock} = state;
      if (!currentDescribeBlock) {
        throw new Error(
          `"currentDescribeBlock" has to be there since we're finishing its definition.`,
        );
      }
      if (currentDescribeBlock.parent) {
        state.currentDescribeBlock = currentDescribeBlock.parent;
      }
      break;
    }
    case 'add_hook': {
      const {currentDescribeBlock} = state;
      const {fn, hookType: type} = event;
      currentDescribeBlock.hooks.push({fn, type});
      break;
    }
    case 'add_test': {
      const {currentDescribeBlock} = state;
      const {fn, mode, testName: name} = event;
      const test = makeTest(fn, mode, name, currentDescribeBlock);
      test.mode === 'only' && (state.hasFocusedTests = true);
      currentDescribeBlock.tests.push(test);
      break;
    }
    case 'test_start': {
      event.test.startedAt = Date.now();
      break;
    }
    case 'test_skip': {
      event.test.status = 'skip';
      break;
    }
    case 'test_failure': {
      event.test.status = 'fail';
      event.test.duration = getTestDuration(event.test);
      event.test.errors.push(event.error);
      break;
    }
    case 'test_success': {
      event.test.status = 'pass';
      event.test.duration = getTestDuration(event.test);
      break;
    }
    case 'run_start': {
      global[TEST_TIMEOUT_SYMBOL] &&
        (state.testTimeout = global[TEST_TIMEOUT_SYMBOL]);
      break;
    }
  }
};

export default handler;
