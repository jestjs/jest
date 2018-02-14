/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import type {JestHookSubscriber} from './jest_hooks';
import type {UsageRow} from './types';

class BaseWatchPlugin {
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

  registerHooks(hooks: JestHookSubscriber) {}

  getUsageRow(globalConfig: GlobalConfig): UsageRow {
    return {hide: true, key: 0, prompt: ''};
  }

  onData(value: string) {}

  showPrompt(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void | boolean> {
    return Promise.resolve();
  }
}

export default BaseWatchPlugin;
