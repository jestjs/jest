/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {BaseWatchPlugin} from 'jest-watcher';

class QuitPlugin extends BaseWatchPlugin {
  isInternal: true;

  constructor(options: {
    stdin: NodeJS.ReadableStream;
    stdout: NodeJS.WritableStream;
  }) {
    super(options);
    this.isInternal = true;
  }

  async run() {
    // @ts-ignore
    if (typeof this._stdin.setRawMode === 'function') {
      // @ts-ignore
      this._stdin.setRawMode(false);
    }
    this._stdout.write('\n');
    process.exit(0);
  }

  getUsageInfo() {
    return {
      key: 'q',
      prompt: 'quit watch mode',
    };
  }
}

export default QuitPlugin;
