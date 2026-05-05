/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus, Global} from '@jest/types';
import {protectProperties, setGlobal} from 'jest-util';
import eventHandler from './eventHandler';
import formatNodeAssertErrors from './formatNodeAssertErrors';
import {EVENT_HANDLERS, STATE_SYM} from './types';
import {makeDescribe} from './utils';

const handlers: Array<Circus.EventHandler> = ((globalThis as Global.Global)[
  EVENT_HANDLERS
] as Array<Circus.EventHandler>) || [eventHandler, formatNodeAssertErrors];
setGlobal(globalThis, EVENT_HANDLERS, handlers, 'retain');

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

export const getState = (): Circus.State =>
  (globalThis as Global.Global)[STATE_SYM] as Circus.State;
export const setState = (state: Circus.State): Circus.State => {
  setGlobal(globalThis, STATE_SYM, state);
  protectProperties(state, [
    'hasFocusedTests',
    'hasStarted',
    'includeTestLocationInResult',
    'maxConcurrency',
    'seed',
    'testNamePattern',
    'testTimeout',
    'unhandledErrors',
    'unhandledRejectionErrorByPromise',
  ]);
  return state;
};
export const resetState = (): void => {
  setState(createState());
};

resetState();

export const dispatch = async (event: Circus.AsyncEvent): Promise<void> => {
  for (const handler of handlers) {
    await handler(event, getState());
  }
};

export const dispatchSync = (event: Circus.SyncEvent): void => {
  for (const handler of handlers) {
    handler(event, getState());
  }
};

export const addEventHandler = (handler: Circus.EventHandler): void => {
  handlers.push(handler);
};

export const removeEventHandler = (handler: Circus.EventHandler): void => {
  const index = handlers.lastIndexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
  }
};
