/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const {EventEmitter} = require('events');

type State = {
  interrupted: boolean,
};

class TestWatcher extends EventEmitter {
  state: State;

  constructor() {
    super();
    this.state = {interrupted: false};
  }

  setState(state: State) {
    this.state = Object.assign({}, this.state, state);
    this.emit('change', this.state);
  }

  isInterrupted() {
    return this.state.interrupted;
  }

}

module.exports = TestWatcher;
