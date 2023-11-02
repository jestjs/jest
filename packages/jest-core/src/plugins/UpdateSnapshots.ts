/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ReadStream, WriteStream} from 'tty';
import type {Config} from '@jest/types';
import {
  BaseWatchPlugin,
  type JestHookSubscriber,
  type UpdateConfigCallback,
  type UsageData,
} from 'jest-watcher';

class UpdateSnapshotsPlugin extends BaseWatchPlugin {
  private _hasSnapshotFailure: boolean;
  isInternal: true;

  constructor(options: {stdin: ReadStream; stdout: WriteStream}) {
    super(options);
    this.isInternal = true;
    this._hasSnapshotFailure = false;
  }

  override run(
    _globalConfig: Config.GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ): Promise<boolean> {
    updateConfigAndRun({updateSnapshot: 'all'});
    return Promise.resolve(false);
  }

  override apply(hooks: JestHookSubscriber): void {
    hooks.onTestRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }

  override getUsageInfo(): UsageData | null {
    if (this._hasSnapshotFailure) {
      return {
        key: 'u',
        prompt: 'update failing snapshots',
      };
    }

    return null;
  }
}

export default UpdateSnapshotsPlugin;
