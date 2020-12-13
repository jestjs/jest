/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import emittery = require('emittery');

type State = {
  interrupted: boolean;
};

export default class TestWatcher extends emittery.Typed<{change: State}> {
  state: State;
  private _isWatchMode: boolean;

  constructor({isWatchMode}: {isWatchMode: boolean}) {
    super();
    this.state = {interrupted: false};
    this._isWatchMode = isWatchMode;
  }

  async setState(state: State): Promise<void> {
    Object.assign(this.state, state);
    await this.emit('change', this.state);
  }

  isInterrupted(): boolean {
    return this.state.interrupted;
  }

  isWatchMode(): boolean {
    return this._isWatchMode;
  }
}
