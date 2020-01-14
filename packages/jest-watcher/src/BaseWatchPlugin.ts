/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {GlobalConfig} from '@jest/config-utils';
import {
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

  apply(_hooks: JestHookSubscriber) {}

  getUsageInfo(_globalConfig: GlobalConfig): UsageData | null {
    return null;
  }

  onKey(_key: string) {}

  run(
    _globalConfig: GlobalConfig,
    _updateConfigAndRun: UpdateConfigCallback,
  ): Promise<void | boolean> {
    return Promise.resolve();
  }
}

export default BaseWatchPlugin;
