/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {EventHandler} from '../types';

import {
  addErrorToEachTestUnderDescribe,
  makeDescribe,
  getTestDuration,
  invariant,
  makeTest,
} from './utils';

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
      invariant(currentDescribeBlock, `currentDescribeBlock mest to be there`);
      if (currentDescribeBlock.parent) {
        state.currentDescribeBlock = currentDescribeBlock.parent;
      }
      break;
    }
    case 'add_hook': {
      const {currentDescribeBlock} = state;
      const {fn, hookType: type, timeout} = event;
      const parent = currentDescribeBlock;
      currentDescribeBlock.hooks.push({fn, parent, timeout, type});
      break;
    }
    case 'add_test': {
      const {currentDescribeBlock} = state;
      const {fn, mode, testName: name, timeout} = event;
      const test = makeTest(fn, mode, name, currentDescribeBlock, timeout);
      test.mode === 'only' && (state.hasFocusedTests = true);
      currentDescribeBlock.tests.push(test);
      break;
    }
    case 'hook_failure': {
      const {test, describeBlock, error, hook} = event;
      const {type} = hook;

      if (type === 'beforeAll') {
        invariant(describeBlock, 'always present for `*All` hooks');
        addErrorToEachTestUnderDescribe(describeBlock, error);
      } else if (type === 'afterAll') {
        // Attaching `afterAll` errors to each test makes execution flow
        // too complicated, so we'll consider them to be global.
        state.unhandledErrors.push(error);
      } else {
        invariant(test, 'always present for `*Each` hooks');
        test.errors.push(error);
      }
      break;
    }
    case 'test_skip': {
      event.test.status = 'skip';
      break;
    }
    case 'test_done': {
      event.test.duration = getTestDuration(event.test);
      event.test.status = 'done';
      break;
    }
    case 'test_start': {
      event.test.startedAt = Date.now();
      break;
    }
    case 'test_fn_failure': {
      event.test.errors.push(event.error);
      break;
    }
    case 'run_start': {
      global[TEST_TIMEOUT_SYMBOL] &&
        (state.testTimeout = global[TEST_TIMEOUT_SYMBOL]);
      break;
    }
    case 'error': {
      state.unhandledErrors.push(event.error);
      break;
    }
  }
};

module.exports = handler;
