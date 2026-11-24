/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import type Runtime from 'jest-runtime';
import {invariant} from 'jest-util';
import {addErrorToEachTestUnderDescribe} from './utils';

// Global values can be overwritten by mocks or tests. We'll capture
// the original values in the variables before we require any files.
const {setTimeout} = globalThis;

const untilNextEventLoopTurn = async () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

const takeUnhandledRejectionErrors = (
  state: Circus.State,
  errorsByPromise: Map<Promise<unknown>, Circus.Exception>,
): Array<Circus.Exception> => {
  const errors = [...errorsByPromise.values()];
  for (const promise of errorsByPromise.keys()) {
    state.unhandledRejectionErrorByPromiseTarget.delete(promise);
  }
  errorsByPromise.clear();
  return errors;
};

const getTestsForDescribeBlock = (
  describeBlock: Circus.DescribeBlock,
): Array<Circus.TestEntry> => {
  const tests: Array<Circus.TestEntry> = [];
  for (const child of describeBlock.children) {
    if (child.type === 'describeBlock') {
      tests.push(...getTestsForDescribeBlock(child));
    } else {
      tests.push(child);
    }
  }
  return tests;
};

const getHooksForDescribeBlock = (
  describeBlock: Circus.DescribeBlock,
): Array<Circus.Hook> => {
  const hooks = [...describeBlock.hooks];
  for (const child of describeBlock.children) {
    if (child.type === 'describeBlock') {
      hooks.push(...getHooksForDescribeBlock(child));
    }
  }
  return hooks;
};

const addPendingHookRejections = (
  state: Circus.State,
  hook: Circus.Hook,
): void => {
  const errorsByPromise =
    state.unhandledRejectionErrorByPromiseByHook.get(hook);
  if (!errorsByPromise) {
    return;
  }

  const errors = takeUnhandledRejectionErrors(state, errorsByPromise);
  state.unhandledRejectionErrorByPromiseByHook.delete(hook);
  for (const error of errors) {
    if (hook.type === 'beforeAll') {
      addErrorToEachTestUnderDescribe(hook.parent, error, hook.asyncError);
    } else if (hook.type === 'afterAll') {
      state.unhandledErrors.push([error, hook.asyncError]);
    }
  }
};

const addPendingTestRejections = (
  state: Circus.State,
  test: Circus.TestEntry,
): void => {
  for (const error of takeUnhandledRejectionErrors(
    state,
    test.unhandledRejectionErrorByPromise,
  )) {
    test.errors.push([error, test.asyncError]);
  }
};

export const unhandledRejectionHandler = (
  runtime: Runtime,
  waitForUnhandledRejections: boolean,
): Circus.EventHandler => {
  return async (event, state) => {
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
      const errorsByPromise =
        state.unhandledRejectionErrorByPromiseByHook.get(hook) ?? new Map();
      const errors = takeUnhandledRejectionErrors(state, errorsByPromise);
      state.unhandledRejectionErrorByPromiseByHook.delete(hook);

      if (type === 'beforeAll') {
        invariant(describeBlock, 'always present for `*All` hooks');
        for (const error of errors) {
          addErrorToEachTestUnderDescribe(describeBlock, error, asyncError);
        }
      } else if (type === 'afterAll') {
        // Attaching `afterAll` errors to each test makes execution flow
        // too complicated, so we'll consider them to be global.
        for (const error of errors) {
          const hookError: Circus.Exception = [error, asyncError];
          state.unhandledErrors.push(hookError);
        }
      } else {
        invariant(test, 'always present for `*Each` hooks');
        for (const error of takeUnhandledRejectionErrors(
          state,
          test.unhandledRejectionErrorByPromise,
        )) {
          const hookError: Circus.Exception = [error, asyncError];
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

      for (const error of takeUnhandledRejectionErrors(
        state,
        test.unhandledRejectionErrorByPromise,
      )) {
        const testError: Circus.Exception = [error, event.test.asyncError];
        test.errors.push(testError);
      }
    } else if (event.name === 'run_describe_finish') {
      if (waitForUnhandledRejections) {
        await untilNextEventLoopTurn();
      }

      for (const hook of getHooksForDescribeBlock(event.describeBlock)) {
        addPendingHookRejections(state, hook);
      }
      for (const test of getTestsForDescribeBlock(event.describeBlock)) {
        addPendingTestRejections(state, test);
      }
    } else if (event.name === 'run_finish' || event.name === 'teardown') {
      if (waitForUnhandledRejections) {
        // We need to give event loop the time to actually execute `rejectionHandled`, `uncaughtException` or `unhandledRejection` events
        await untilNextEventLoopTurn();
      }

      state.unhandledErrors.push(
        ...takeUnhandledRejectionErrors(
          state,
          state.unhandledRejectionErrorByPromise,
        ),
      );
    }
  };
};
