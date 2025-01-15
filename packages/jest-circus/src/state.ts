/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus, Global} from '@jest/types';
import eventHandler from './eventHandler';
import formatNodeAssertErrors from './formatNodeAssertErrors';
import {STATE_SYM} from './types';
import {makeDescribe} from './utils';

const eventHandlers: Array<Circus.EventHandler> = [
  eventHandler,
  formatNodeAssertErrors,
];

export const ROOT_DESCRIBE_BLOCK_NAME = 'ROOT_DESCRIBE_BLOCK';

const createState = (): Circus.State => {
  const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  return {
    currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
    currentlyRunningTest: null,
    expand: undefined,
    hasFocusedTests: false,
    hasStarted: false,
    includeTestLocationInResult: false,
    maxConcurrency: 5,
    parentProcess: null,
    rootDescribeBlock: ROOT_DESCRIBE_BLOCK,
    seed: 0,
    testNamePattern: null,
    testTimeout: 5000,
    unhandledErrors: [],
    unhandledRejectionErrorByPromise: new Map(),
  };
};

export const resetState = (): void => {
  (globalThis as Global.Global)[STATE_SYM] = createState();
};

resetState();

export const getState = (): Circus.State =>
  (globalThis as Global.Global)[STATE_SYM] as Circus.State;
export const setState = (state: Circus.State): Circus.State =>
  ((globalThis as Global.Global)[STATE_SYM] = state);

export const dispatch = async (event: Circus.AsyncEvent): Promise<void> => {
  for (const handler of eventHandlers) {
    await handler(event, getState());
  }
};

export const dispatchSync = (event: Circus.SyncEvent): void => {
  for (const handler of eventHandlers) {
    handler(event, getState());
  }
};

export const addEventHandler = (handler: Circus.EventHandler): void => {
  eventHandlers.push(handler);
};
