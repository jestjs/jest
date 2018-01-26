/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import WatchPlugin from '../watch_plugin';

class QuitPlugin extends WatchPlugin {
  showPrompt(): Promise<void> {
    this._stdout.write('\n');
    process.exit(0);
    return Promise.resolve();
  }

  getUsageRow() {
    return {
      key: 'q'.codePointAt(0),
      prompt: 'quit watch mode',
    };
  }
}

export default QuitPlugin;
