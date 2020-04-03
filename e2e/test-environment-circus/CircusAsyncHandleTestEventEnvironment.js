/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const BaseTestEnvironment = require('./CircusHandleTestEventEnvironment');

const SYNC_EVENTS = [
  'start_describe_definition',
  'finish_describe_definition',
  'add_hook',
  'add_test',
  'error',
];

const isAsyncEvent = e => SYNC_EVENTS.indexOf(e.name) === -1;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class TestEnvironment extends BaseTestEnvironment {
  async handleTestEvent(event) {
    this.pendingEvents = this.pendingEvents || new Set();
    if (this.pendingEvents.size > 0) {
      console.log('async handleTestEvent is not respected');
    }

    if (isAsyncEvent(event)) {
      this.pendingEvents.add(event);
      await sleep(0);
      this.pendingEvents.delete(event);
    }

    await super.handleTestEvent(event);
  }
}

module.exports = TestEnvironment;
