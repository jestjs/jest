/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import type {
  JestHookSubscriber,
  UpdateConfigCallback,
  UsageData,
  WatchPlugin,
} from './types';

class BaseWatchPlugin implements WatchPlugin {
  protected _stdin: NodeJS.ReadStream;
  protected _stdout: NodeJS.WriteStream;

  constructor({
    stdin,
    stdout,
  }: {
    stdin: NodeJS.ReadStream;
    stdout: NodeJS.WriteStream;
  }) {
    this._stdin = stdin;
    this._stdout = stdout;
  }

  apply(_hooks: JestHookSubscriber): void {}

  getUsageInfo(_globalConfig: Config.GlobalConfig): UsageData | null {
    return null;
  }

  onKey(_key: string): void {}

  run(
    _globalConfig: Config.GlobalConfig,
    _updateConfigAndRun: UpdateConfigCallback,
  ): Promise<void | boolean> {
    return Promise.resolve();
  }
}

export default BaseWatchPlugin;
