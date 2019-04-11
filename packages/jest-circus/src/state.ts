/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Event,
  State,
  EventHandler,
  STATE_SYMBOL,
  JEST_EVENT_HANDLERS_SYMBOL,
} from './types';

import {makeDescribe} from './utils';
import eventHandler from './eventHandler';
import formatNodeAssertErrors from './formatNodeAssertErrors';

export const ROOT_DESCRIBE_BLOCK_NAME = 'ROOT_DESCRIBE_BLOCK';

const getEventHandlers = () => {
  if (!global[JEST_EVENT_HANDLERS_SYMBOL]) {
    global[JEST_EVENT_HANDLERS_SYMBOL] = [eventHandler, formatNodeAssertErrors];
  }
  return global[JEST_EVENT_HANDLERS_SYMBOL];
};

export const getState = (): State => {
  if (!global[STATE_SYMBOL]) {
    const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
    global[STATE_SYMBOL] = {
      currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
      currentlyRunningTest: null,
      expand: undefined,
      hasFocusedTests: false, // whether .only has been used on any test/describe
      includeTestLocationInResult: false,
      parentProcess: null,
      rootDescribeBlock: ROOT_DESCRIBE_BLOCK,
      testNamePattern: null,
      testTimeout: 5000,
      unhandledErrors: [],
    } as State;
  }

  return global[STATE_SYMBOL];
};

export const setState = (state: State): State => (global[STATE_SYMBOL] = state);

export const dispatch = (event: Event): void => {
  for (const handler of getEventHandlers()) {
    handler(event, getState());
  }
};

export const addEventHandler = (handler: EventHandler): void => {
  getEventHandlers().push(handler);
};
