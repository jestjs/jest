/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';

const testEventHandler: Circus.EventHandler = (event, state) => {
  switch (event.name) {
    case 'start_describe_definition':
    case 'finish_describe_definition': {
      console.log(`${event.name}:`, event.blockName);
      break;
    }
    case 'run_describe_start':
    case 'run_describe_finish': {
      console.log(`${event.name}:`, event.describeBlock.name);
      break;
    }
    case 'test_start':
    case 'test_started':
    case 'test_retry':
    case 'test_done': {
      console.log(`${event.name}:`, event.test.name);
      break;
    }

    case 'add_test': {
      console.log(`${event.name}:`, event.testName);
      break;
    }

    case 'test_fn_start':
    case 'test_fn_success':
    case 'test_fn_failure': {
      console.log(`${event.name}:`, event.test.name);
      break;
    }

    case 'add_hook': {
      console.log(`${event.name}:`, event.hookType);
      break;
    }

    case 'hook_start':
    case 'hook_success':
    case 'hook_failure': {
      console.log(`${event.name}:`, event.hook.type);
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
