/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import type {AggregatedResult, AssertionLocation} from '@jest/test-result';
import type {Config} from '@jest/types';
import {
  BaseWatchPlugin,
  type JestHookSubscriber,
  type UsageData,
} from 'jest-watcher';
import SnapshotInteractiveMode from '../SnapshotInteractiveMode';

class UpdateSnapshotInteractivePlugin extends BaseWatchPlugin {
  private readonly _snapshotInteractiveMode: SnapshotInteractiveMode =
    new SnapshotInteractiveMode(this._stdout);
  private _failedSnapshotTestAssertions: Array<AssertionLocation> = [];
  isInternal = true as const;

  getFailedSnapshotTestAssertions(
    testResults: AggregatedResult,
  ): Array<AssertionLocation> {
    const failedTestPaths: Array<AssertionLocation> = [];
    if (testResults.numFailedTests === 0 || !testResults.testResults) {
      return failedTestPaths;
    }

    for (const testResult of testResults.testResults) {
      if (testResult.snapshot && testResult.snapshot.unmatched) {
        for (const result of testResult.testResults) {
          if (result.status === 'failed') {
            failedTestPaths.push({
              fullName: result.fullName,
              path: testResult.testFilePath,
            });
          }
        }
      }
    }

    return failedTestPaths;
  }

  override apply(hooks: JestHookSubscriber): void {
    hooks.onTestRunComplete(results => {
      this._failedSnapshotTestAssertions =
        this.getFailedSnapshotTestAssertions(results);
      if (this._snapshotInteractiveMode.isActive()) {
        this._snapshotInteractiveMode.updateWithResults(results);
      }
    });
  }

  override onKey(key: string): void {
    if (this._snapshotInteractiveMode.isActive()) {
      this._snapshotInteractiveMode.put(key);
    }
  }

  override run(
    _globalConfig: Config.GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<void> {
    if (this._failedSnapshotTestAssertions.length > 0) {
      return new Promise(resolve => {
        this._snapshotInteractiveMode.run(
          this._failedSnapshotTestAssertions,
          (assertion, shouldUpdateSnapshot) => {
            updateConfigAndRun({
              mode: 'watch',
              testNamePattern: assertion ? `^${assertion.fullName}$` : '',
              testPathPatterns: assertion ? [assertion.path] : [],

              updateSnapshot: shouldUpdateSnapshot ? 'all' : 'none',
            });
            if (!this._snapshotInteractiveMode.isActive()) {
              resolve();
            }
          },
        );
      });
    } else {
      return Promise.resolve();
    }
  }

  override getUsageInfo(): UsageData | null {
    if (this._failedSnapshotTestAssertions?.length > 0) {
      return {
        key: 'i',
        prompt: 'update failing snapshots interactively',
      };
    }

    return null;
  }
}

export default UpdateSnapshotInteractivePlugin;
