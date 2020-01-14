/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {GlobalConfig} from '@jest/config-utils';
import {
  BaseWatchPlugin,
  JestHookSubscriber,
  UpdateConfigCallback,
} from 'jest-watcher';

class UpdateSnapshotsPlugin extends BaseWatchPlugin {
  private _hasSnapshotFailure: boolean;
  isInternal: true;

  constructor(options: {stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream}) {
    super(options);
    this.isInternal = true;
    this._hasSnapshotFailure = false;
  }

  run(
    _globalConfig: GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ): Promise<boolean> {
    updateConfigAndRun({updateSnapshot: 'all'});
    return Promise.resolve(false);
  }

  apply(hooks: JestHookSubscriber) {
    hooks.onTestRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }

  getUsageInfo() {
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
