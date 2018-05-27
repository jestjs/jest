/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import type {JestHookSubscriber} from 'types/JestHooks';
import type {WatchPlugin, UsageData} from './types';

class BaseWatchPlugin implements WatchPlugin {
  _stdin: stream$Readable | tty$ReadStream;
  _stdout: stream$Writable | tty$WriteStream;
  constructor({
    stdin,
    stdout,
  }: {
    stdin: stream$Readable | tty$ReadStream,
    stdout: stream$Writable | tty$WriteStream,
  }) {
    this._stdin = stdin;
    this._stdout = stdout;
  }

  apply(hooks: JestHookSubscriber) {}

  getUsageInfo(globalConfig: GlobalConfig): ?UsageData {
    return null;
  }

  onKey(value: string) {}

  run(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void | boolean> {
    return Promise.resolve();
  }
}

export default BaseWatchPlugin;
