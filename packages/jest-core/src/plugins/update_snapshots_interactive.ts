/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {AggregatedResult, AssertionLocation} from '@jest/test-result';
import {BaseWatchPlugin, JestHookSubscriber} from 'jest-watcher';
import SnapshotInteractiveMode from '../SnapshotInteractiveMode';

class UpdateSnapshotInteractivePlugin extends BaseWatchPlugin {
  private _snapshotInteractiveMode: SnapshotInteractiveMode;
  private _failedSnapshotTestAssertions: Array<AssertionLocation>;
  isInternal: true;

  constructor(options: {stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream}) {
    super(options);
    this._failedSnapshotTestAssertions = [];
    this._snapshotInteractiveMode = new SnapshotInteractiveMode(this._stdout);
    this.isInternal = true;
  }

  getFailedSnapshotTestAssertions(
    testResults: AggregatedResult,
  ): Array<AssertionLocation> {
    const failedTestPaths: Array<AssertionLocation> = [];
    if (testResults.numFailedTests === 0 || !testResults.testResults) {
      return failedTestPaths;
    }

    testResults.testResults.forEach(testResult => {
      if (testResult.snapshot && testResult.snapshot.unmatched) {
        testResult.testResults.forEach(result => {
          if (result.status === 'failed') {
            failedTestPaths.push({
              fullName: result.fullName,
              path: testResult.testFilePath,
            });
          }
        });
      }
    });

    return failedTestPaths;
  }

  apply(hooks: JestHookSubscriber) {
    hooks.onTestRunComplete(results => {
      this._failedSnapshotTestAssertions = this.getFailedSnapshotTestAssertions(
        results,
      );
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

  run(
    _globalConfig: Config.GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void> {
    if (this._failedSnapshotTestAssertions.length) {
      return new Promise(res => {
        this._snapshotInteractiveMode.run(
          this._failedSnapshotTestAssertions,
          (assertion, shouldUpdateSnapshot) => {
            updateConfigAndRun({
              mode: 'watch',
              testNamePattern: assertion ? `^${assertion.fullName}$` : '',
              testPathPattern: assertion ? assertion.path : '',

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

  getUsageInfo() {
    if (
      this._failedSnapshotTestAssertions &&
      this._failedSnapshotTestAssertions.length > 0
    ) {
      return {
        key: 'i',
        prompt: 'update failing snapshots interactively',
      };
    }

    return null;
  }
}

export default UpdateSnapshotInteractivePlugin;
