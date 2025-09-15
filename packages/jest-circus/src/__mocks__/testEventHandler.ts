/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import {ROOT_DESCRIBE_BLOCK_NAME} from '../state';

const getDescribeBlockPath = (block: Circus.DescribeBlock) => {
  const blockPath = [];
  while (block.name !== ROOT_DESCRIBE_BLOCK_NAME) {
    if (!block.parent) {
      throw new Error('Unexpected block without parent');
    }
    blockPath.unshift(block.name);
    block = block.parent;
  }
  return blockPath;
};

const formatEventPath = (block: Circus.DescribeBlock, name?: string) => {
  const eventPath = getDescribeBlockPath(block);
  if (name) {
    eventPath.push(name);
  }
  return eventPath.join(' > ');
};

const testEventHandler: Circus.EventHandler = (event, state) => {
  switch (event.name) {
    case 'start_describe_definition': {
      console.log(
        `${event.name}:`,
        formatEventPath(state.currentDescribeBlock),
      );
      break;
    }
    case 'finish_describe_definition': {
      console.log(
        `${event.name}:`,
        formatEventPath(state.currentDescribeBlock, event.blockName),
      );
      break;
    }
    case 'run_describe_start':
    case 'run_describe_finish': {
      console.log(`${event.name}:`, formatEventPath(event.describeBlock));
      break;
    }
    case 'test_start':
    case 'test_started':
    case 'test_retry':
    case 'test_done':
    case 'test_skip': {
      console.log(
        `${event.name}:`,
        formatEventPath(event.test.parent, event.test.name),
      );
      break;
    }

    case 'add_test': {
      console.log(
        `${event.name}:`,
        formatEventPath(state.currentDescribeBlock, event.testName),
      );
      break;
    }

    case 'test_fn_start':
    case 'test_fn_success':
    case 'test_fn_failure': {
      console.log(
        `${event.name}:`,
        formatEventPath(event.test.parent, event.test.name),
      );
      break;
    }

    case 'add_hook': {
      console.log(
        `${event.name}:`,
        formatEventPath(state.currentDescribeBlock, event.hookType),
      );
      break;
    }

    case 'hook_start':
    case 'hook_success':
    case 'hook_failure': {
      console.log(
        `${event.name}:`,
        formatEventPath(event.hook.parent, event.hook.type),
      );
      break;
    }

    default:
      console.log(event.name);
  }

  if (event.name === 'run_finish') {
    console.log('');
    console.log(`unhandledErrors: ${String(state.unhandledErrors.length)}`);
  }
};

export default testEventHandler;
