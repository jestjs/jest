/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Emittery = require('emittery');

type State = {
  interrupted: boolean;
};

export default class TestWatcher extends Emittery<{change: State}> {
  state: State;
  private readonly _isWatchMode: boolean;

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
