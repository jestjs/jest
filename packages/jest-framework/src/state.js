/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Event, State, EventHandler} from '../types';

const TOP_DESCRIBE_BLOCK_NAME = 'JEST_TOP_DESCRIBE_BLOCK';

const {makeDescribe} = require('./utils');
const eventHandler = require('./eventHandler');

const eventHandlers: Array<EventHandler> = [eventHandler];

const STATE_SYM = Symbol('JEST_STATE_SYMBOL');

const TOP_DESCRIBE_BLOCK = makeDescribe(TOP_DESCRIBE_BLOCK_NAME);
const INITIAL_STATE: State = {
  currentDescribeBlock: TOP_DESCRIBE_BLOCK,
  hasFocusedTests: false,
  sharedHooksThatHaveBeenExecuted: new Set(),
  testTimeout: 5000,
  topDescribeBlock: TOP_DESCRIBE_BLOCK,
};

global[STATE_SYM] = INITIAL_STATE;

const getState = (): State => global[STATE_SYM];
const setState = (state: State): State => (global[STATE_SYM] = state);

const dispatch = (event: Event): void => {
  for (const handler of eventHandlers) {
    handler(event, getState());
  }
};

const addEventHandler = (handler: EventHandler): void => {
  eventHandlers.push(handler);
};

module.exports = {
  TOP_DESCRIBE_BLOCK_NAME,
  addEventHandler,
  dispatch,
  getState,
  setState,
};
