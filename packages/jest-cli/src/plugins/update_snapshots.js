/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import BaseWatchPlugin from '../base_watch_plugin';
import type {JestHookSubscriber} from '../jest_hooks';

class UpdateSnapshotsPlugin extends BaseWatchPlugin {
  _hasSnapshotFailure: boolean;
  run(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<boolean> {
    updateConfigAndRun({updateSnapshot: 'all'});
    return Promise.resolve(false);
  }

  apply(hooks: JestHookSubscriber) {
    hooks.testRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }

  getUsageInfo(globalConfig: GlobalConfig) {
    if (this._hasSnapshotFailure) {
      return {
        key: 'u'.codePointAt(0),
        prompt: 'update failing snapshots',
      };
    }

    return null;
  }
}

export default UpdateSnapshotsPlugin;
