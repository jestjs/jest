/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {JestHookSubscriber} from '../jest_hooks';
import type {GlobalConfig} from 'types/Config';
import BaseWatchPlugin from '../base_watch_plugin';
import {getFailedSnapshotTests} from 'jest-util';
import SnapshotInteractiveMode from '../snapshot_interactive_mode';

class UpdateSnapshotInteractivePlugin extends BaseWatchPlugin {
  _snapshotInteractiveMode: SnapshotInteractiveMode;
  _failedSnapshotTestPaths: Array<*>;

  constructor(options: {
    stdin: stream$Readable | tty$ReadStream,
    stdout: stream$Writable | tty$WriteStream,
  }) {
    super(options);
    this._failedSnapshotTestPaths = [];
    this._snapshotInteractiveMode = new SnapshotInteractiveMode(this._stdout);
  }

  apply(hooks: JestHookSubscriber) {
    hooks.testRunComplete(results => {
      this._failedSnapshotTestPaths = getFailedSnapshotTests(results);
      if (this._snapshotInteractiveMode.isActive()) {
        this._snapshotInteractiveMode.updateWithResults(results);
      }
    });
  }

  onKey(key: string) {
    if (this._snapshotInteractiveMode.isActive()) {
      this._snapshotInteractiveMode.put(key);
    }
  }

  run(globalConfig: GlobalConfig, updateConfigAndRun: Function): Promise<void> {
    if (this._failedSnapshotTestPaths.length) {
      return new Promise(res => {
        this._snapshotInteractiveMode.run(
          this._failedSnapshotTestPaths,
          (path: string, shouldUpdateSnapshot: boolean) => {
            updateConfigAndRun({
              mode: 'watch',
              testNamePattern: '',
              testPathPattern: path,
              updateSnapshot: shouldUpdateSnapshot ? 'all' : 'none',
            });
            if (!this._snapshotInteractiveMode.isActive()) {
              res();
            }
          },
        );
      });
    } else {
      return Promise.resolve();
    }
  }

  getUsageInfo(globalConfig: GlobalConfig) {
    if (
      this._failedSnapshotTestPaths &&
      this._failedSnapshotTestPaths.length > 0
    ) {
      return {
        key: 'i'.codePointAt(0),
        prompt: 'update failing snapshots interactively',
      };
    }

    return null;
  }
}

export default UpdateSnapshotInteractivePlugin;
