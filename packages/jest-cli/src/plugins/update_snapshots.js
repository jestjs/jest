/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import WatchPlugin from '../watch_plugin';

class UpdateSnapshotsPlugin extends WatchPlugin {
  showPrompt(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void> {
    updateConfigAndRun({updateSnapshot: 'all'});
    return Promise.resolve(false);
  }

  getUsageRow(globalConfig: GlobalConfig, hasSnapshotFailures: boolean) {
    return {
      hide: !hasSnapshotFailures,
      key: 'u'.codePointAt(0),
      prompt: 'update failing snapshots',
    };
  }
}

export default UpdateSnapshotsPlugin;
