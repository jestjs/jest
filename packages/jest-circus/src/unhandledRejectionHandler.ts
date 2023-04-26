/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import {addErrorToEachTestUnderDescribe, invariant} from './utils';

/**
 * Let's keep the original setTimeout for the usage below so we do not need to care about usage of fake timers in tests.
 */
const originalSetTimeout = globalThis.setTimeout;

const untilNextEventLoopTurn = async () => {
  return new Promise(resolve => {
    originalSetTimeout(resolve, 0);
  });
};

const unhandledRejectionHandler: Circus.EventHandler = async (
  event,
  state,
): Promise<void> => {
  if (event.name === 'hook_success' || event.name === 'hook_failure') {
    // We need to give event loop the time to actually execute `rejectionHandled` event
    await untilNextEventLoopTurn();

    const {test, describeBlock, hook} = event;
    const {asyncError, type} = hook;

    if (type === 'beforeAll') {
      invariant(describeBlock, 'always present for `*All` hooks');
      for (const error of state.unhandledRejectionErrorByPromise.values()) {
        addErrorToEachTestUnderDescribe(describeBlock, error, asyncError);
      }
    } else if (type === 'afterAll') {
      // Attaching `afterAll` errors to each test makes execution flow
      // too complicated, so we'll consider them to be global.
      for (const error of state.unhandledRejectionErrorByPromise.values()) {
        state.unhandledErrors.push([error, asyncError]);
      }
    } else {
      invariant(test, 'always present for `*Each` hooks');
      for (const error of test.unhandledRejectionErrorByPromise.values()) {
        test.errors.push([error, asyncError]);
      }
    }
  } else if (
    event.name === 'test_fn_success' ||
    event.name === 'test_fn_failure'
  ) {
    // We need to give event loop the time to actually execute `rejectionHandled` event
    await untilNextEventLoopTurn();

    const {test} = event;
    invariant(test, 'always present for `*Each` hooks');

    for (const error of test.unhandledRejectionErrorByPromise.values()) {
      test.errors.push([error, event.test.asyncError]);
    }
  } else if (event.name === 'teardown') {
    // We need to give event loop the time to actually execute `rejectionHandled` event
    await untilNextEventLoopTurn();

    state.unhandledErrors.push(
      ...state.unhandledRejectionErrorByPromise.values(),
    );
  }
};

export default unhandledRejectionHandler;
