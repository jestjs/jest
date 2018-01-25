/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {WatchPlugin} from '../types';
import {getFailedSnapshotTests} from 'jest-util';
import SnapshotInteractiveMode from '../snapshot_interactive_mode';

const PLUGIN_NAME = 'update-snapshots-interactive';
const updateSnapshotsInteractivePlugin: WatchPlugin = {
  apply: (jestHooks, {stdin, stdout}) => {
    let failedSnapshotTestPaths = [];
    const snapshotInteractiveMode = new SnapshotInteractiveMode(stdout);

    jestHooks.testRunComplete.tap(PLUGIN_NAME, results => {
      failedSnapshotTestPaths = getFailedSnapshotTests(results);
      if (snapshotInteractiveMode.isActive()) {
        snapshotInteractiveMode.updateWithResults(results);
      }
    });

    stdin.on('data', key => {
      if (snapshotInteractiveMode.isActive()) {
        snapshotInteractiveMode.put(key);
      }
    });

    jestHooks.showPrompt.tapPromise(
      PLUGIN_NAME,
      (globalConfig, updateConfigAndRun) => {
        if (failedSnapshotTestPaths.length) {
          return new Promise(res => {
            snapshotInteractiveMode.run(
              failedSnapshotTestPaths,
              (path: string, shouldUpdateSnapshot: boolean) => {
                updateConfigAndRun({
                  testNamePattern: '',
                  testPathPattern: path,
                  updateSnapshot: shouldUpdateSnapshot ? 'all' : 'none',
                });
                if (!snapshotInteractiveMode.isActive()) {
                  res();
                }
              },
            );
          });
        } else {
          return Promise.resolve();
        }
      },
    );
  },
  key: 'i'.codePointAt(0),
  name: PLUGIN_NAME,
  prompt: 'update failing snapshots interactively',
  shouldShowUsage: (globalConfig, hasSnapshotFailures) => hasSnapshotFailures,
};

export default updateSnapshotsInteractivePlugin;
