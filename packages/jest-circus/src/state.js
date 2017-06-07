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


const {makeDescribe} = require('./utils');
const eventHandler = require('./eventHandler');

const eventHandlers: Array<EventHandler> = [eventHandler];

const ROOT_DESCRIBE_BLOCK_NAME = 'ROOT_DESCRIBE_BLOCK';
const STATE_SYM = Symbol('JEST_STATE_SYMBOL');

const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
const INITIAL_STATE: State = {
  currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
  hasFocusedTests: false,
  rootDescribeBlock: ROOT_DESCRIBE_BLOCK,
  testTimeout: 5000,
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
  ROOT_DESCRIBE_BLOCK_NAME,
  addEventHandler,
  dispatch,
  getState,
  setState,
};
