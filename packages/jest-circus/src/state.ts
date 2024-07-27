/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus, Global} from '@jest/types';
import {setGlobal, setNotShreddable} from 'jest-util';
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

/* eslint-disable no-restricted-globals */
export const getState = (): Circus.State =>
  (global as Global.Global)[STATE_SYM] as Circus.State;
export const setState = (state: Circus.State): Circus.State => {
  setGlobal(global, STATE_SYM, state);
  setNotShreddable(state, [
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
/* eslint-enable */

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
