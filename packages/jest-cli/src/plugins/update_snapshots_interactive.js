/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {JestHookSubscriber} from '../jest_hooks';
import type {AggregatedResult} from 'types/TestResult';
import type {GlobalConfig} from 'types/Config';
import WatchPlugin from '../watch_plugin';
import {getFailedSnapshotTests} from 'jest-util';
import SnapshotInteractiveMode from '../snapshot_interactive_mode';

const PLUGIN_NAME = 'update-snapshots-interactive';

class UpdateSnapshotInteractivePlugin extends WatchPlugin {
  _snapshotInteractiveMode: SnapshotInteractiveMode;
  _failedSnapshotTestPaths: Array<*>;

  constructor(options: {
    stdin: stream$Readable | tty$ReadStream,
    stdout: stream$Writable | tty$WriteStream,
  }) {
    super(options);
    this._snapshotInteractiveMode = new SnapshotInteractiveMode(this._stdout);
  }

  registerHooks(hooks: JestHookSubscriber) {
    hooks.testRunComplete(results => {
      this._failedSnapshotTestPaths = getFailedSnapshotTests(results);
      if (this._snapshotInteractiveMode.isActive()) {
        this._snapshotInteractiveMode.updateWithResults(results);
      }
    });
  }

  onData(key: string) {
    if (this._snapshotInteractiveMode.isActive()) {
      this._snapshotInteractiveMode.put(key);
    }
  }

  showPrompt(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void> {
    if (this._failedSnapshotTestPaths.length) {
      return new Promise(res => {
        this._snapshotInteractiveMode.run(
          this._failedSnapshotTestPaths,
          (path: string, shouldUpdateSnapshot: boolean) => {
            updateConfigAndRun({
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

  getUsageRow(globalConfig: GlobalConfig, hasSnapshotFailures: boolean) {
    return {
      hide: !hasSnapshotFailures,
      key: 'i'.codePointAt(0),
      prompt: 'update failing snapshots interactively',
    };
  }
}

export default UpdateSnapshotInteractivePlugin;
