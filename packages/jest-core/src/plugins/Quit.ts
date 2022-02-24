/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {BaseWatchPlugin, UsageData} from 'jest-watcher';

class QuitPlugin extends BaseWatchPlugin {
  isInternal: true;

  constructor(options: {stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream}) {
    super(options);
    this.isInternal = true;
  }

  async run(): Promise<void> {
    if (typeof this._stdin.setRawMode === 'function') {
      this._stdin.setRawMode(false);
    }
    this._stdout.write('\n');
    process.exit(0);
  }

  getUsageInfo(): UsageData {
    return {
      key: 'q',
      prompt: 'quit watch mode',
    };
  }
}

export default QuitPlugin;
