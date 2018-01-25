/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {WatchPlugin} from '../types';

const PLUGIN_NAME = 'update-snapshots';
const updateSnapshotsPlugin: WatchPlugin = {
  apply: (watchPromptHooks, {stdin, stdout}) => {
    watchPromptHooks.showPrompt.tapPromise(
      PLUGIN_NAME,
      (globalConfig, updateConfigAndRun) => {
        updateConfigAndRun({updateSnapshot: 'all'});
        return Promise.resolve();
      },
    );
  },
  key: 'u'.codePointAt(0),
  name: PLUGIN_NAME,
  prompt: 'update failing snapshots',
  shouldShowUsage: (globalConfig, hasSnapshotFailures) => hasSnapshotFailures,
};

export default updateSnapshotsPlugin;
