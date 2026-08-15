/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AsyncLocalStorage} from 'node:async_hooks';
import type {Circus} from '@jest/types';

type TestExecutionContext = {
  hook?: Circus.Hook;
  test?: Circus.TestEntry;
};

const testExecutionContext = new AsyncLocalStorage<TestExecutionContext>();
let activeDescribeRetryAttempts = 0;

export const getTestExecutionContext = (): TestExecutionContext | undefined =>
  testExecutionContext.getStore();

export const runInTestExecutionContext = <T>(
  context: TestExecutionContext,
  callback: () => T,
): T =>
  testExecutionContext.run(
    {...testExecutionContext.getStore(), ...context},
    callback,
  );

export const startDescribeRetryAttempt = (): void => {
  activeDescribeRetryAttempts++;
};

export const finishDescribeRetryAttempt = (): void => {
  activeDescribeRetryAttempts--;
};

export const hasActiveDescribeRetryAttempt = (): boolean =>
  activeDescribeRetryAttempts > 0;
