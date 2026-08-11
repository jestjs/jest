/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import type Runtime from 'jest-runtime';
import {invariant} from 'jest-util';
import type {InternalCircusState} from './types';
import {addErrorToEachTestUnderDescribe} from './utils';

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout} = globalThis;

const untilNextEventLoopTurn = async () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

export const unhandledRejectionHandler = (
  runtime: Runtime,
  waitForUnhandledRejections: boolean,
): Circus.EventHandler => {
  return async (event, state) => {
    const markDescribeRetryNonRetryable = () =>
      (state as InternalCircusState).processErrorGeneration++;

    if (event.name === 'hook_start') {
      runtime.enterTestCode();
    } else if (event.name === 'hook_success' || event.name === 'hook_failure') {
      runtime.leaveTestCode();

      if (waitForUnhandledRejections) {
        // We need to give event loop the time to actually execute `rejectionHandled`, `uncaughtException` or `unhandledRejection` events
        await untilNextEventLoopTurn();
      }

      const {test, describeBlock, hook} = event;
      const {asyncError, type} = hook;

      if (type === 'beforeAll') {
        invariant(describeBlock, 'always present for `*All` hooks');
        for (const error of state.unhandledRejectionErrorByPromise.values()) {
          markDescribeRetryNonRetryable();
          addErrorToEachTestUnderDescribe(describeBlock, error, asyncError);
        }
      } else if (type === 'afterAll') {
        // Attaching `afterAll` errors to each test makes execution flow
        // too complicated, so we'll consider them to be global.
        for (const error of state.unhandledRejectionErrorByPromise.values()) {
          const hookError: Circus.Exception = [error, asyncError];
          markDescribeRetryNonRetryable();
          state.unhandledErrors.push(hookError);
        }
      } else {
        invariant(test, 'always present for `*Each` hooks');
        for (const error of test.unhandledRejectionErrorByPromise.values()) {
          const hookError: Circus.Exception = [error, asyncError];
          markDescribeRetryNonRetryable();
          test.errors.push(hookError);
        }
      }
    } else if (event.name === 'test_fn_start') {
      runtime.enterTestCode();
    } else if (
      event.name === 'test_fn_success' ||
      event.name === 'test_fn_failure'
    ) {
      runtime.leaveTestCode();

      if (waitForUnhandledRejections) {
        // We need to give event loop the time to actually execute `rejectionHandled`, `uncaughtException` or `unhandledRejection` events
        await untilNextEventLoopTurn();
      }

      const {test} = event;
      invariant(test, 'always present for `*Each` hooks');

      for (const error of test.unhandledRejectionErrorByPromise.values()) {
        const testError: Circus.Exception = [error, event.test.asyncError];
        markDescribeRetryNonRetryable();
        test.errors.push(testError);
      }
    } else if (event.name === 'teardown') {
      if (waitForUnhandledRejections) {
        // We need to give event loop the time to actually execute `rejectionHandled`, `uncaughtException` or `unhandledRejection` events
        await untilNextEventLoopTurn();
      }

      state.unhandledErrors.push(
        ...state.unhandledRejectionErrorByPromise.values(),
      );
    }
  };
};
