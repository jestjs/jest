/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {AggregatedResult} from 'types/TestResult';
import type {Config} from 'types/Config';

const chalk = require('chalk');
const BaseReporter = require('./BaseReporter');

type SnapshotSummary = {
  added: number,
  didUpdate: boolean,
  filesAdded: number,
  filesRemoved: number,
  filesUnmatched: number,
  filesUpdated: number,
  matched: number,
  total: number,
  unchecked: number,
  unmatched: number,
  updated: number,
};

const FAIL_COLOR = chalk.bold.red;
const PASS_COLOR = chalk.bold.green;
const PENDING_COLOR = chalk.bold.yellow;
const SNAPSHOT_ADDED = chalk.bold.green;
const SNAPSHOT_UPDATED = chalk.bold.green;
const SNAPSHOT_REMOVED = chalk.bold.red;
const SNAPSHOT_SUMMARY = chalk.bold;
const TEST_SUMMARY_THRESHOLD = 20;

const pluralize = (word, count) => `${count} ${word}${count === 1 ? '' : 's'}`;

class SummareReporter extends BaseReporter {
  onRunComplete(config: Config, aggregatedResults: AggregatedResult) {
    const totalTestSuites = aggregatedResults.numTotalTestSuites;
    const failedTests = aggregatedResults.numFailedTests;
    const passedTests = aggregatedResults.numPassedTests;
    const pendingTests = aggregatedResults.numPendingTests;
    const totalTests = aggregatedResults.numTotalTests;
    const totalErrors = aggregatedResults.numRuntimeErrorTestSuites;
    const runTime = (Date.now() - aggregatedResults.startTime) / 1000;

    const snapshots = this._getSnapshotSummary(aggregatedResults);
    const snapshotFailure = !!(!snapshots.didUpdate && (
      snapshots.unchecked ||
      snapshots.unmatched ||
      snapshots.filesRemoved
    ));

    let results = '';

    if (snapshotFailure) {
      results += FAIL_COLOR('snapshot failure') + ', ';
    }

    if (failedTests) {
      results +=
        FAIL_COLOR(`${pluralize('test', failedTests)} failed`) + ', ';
    }

    if (totalErrors) {
      results +=
        FAIL_COLOR(`${pluralize('test suite', totalErrors)} failed`) + ', ';
    }

    if (pendingTests) {
      results +=
        PENDING_COLOR(`${pluralize('test', pendingTests)} skipped`) + ', ';
    }

    results +=
      `${PASS_COLOR(`${pluralize('test', passedTests)} passed`)} ` +
      `(${totalTests} total in ${pluralize('test suite', totalTestSuites)}, ` +
      (snapshots.total ? pluralize('snapshot', snapshots.total) + ', ' : '') +
      `run time ${runTime}s)`;

    this._printSummary(aggregatedResults);
    this._printSnapshotSummary(snapshots);
    this.log(results);

    if (failedTests || totalErrors || snapshotFailure) {
      this._setError(new Error('Some of the tests failed'));
    }
  }

  _getSnapshotSummary(aggregatedResults: AggregatedResult): SnapshotSummary {
    let added = 0;
    let filesAdded = 0;
    let filesRemoved = aggregatedResults.snapshotFilesRemoved;
    let filesUnmatched = 0;
    let filesUpdated = 0;
    let matched = 0;
    let unchecked = 0;
    let unmatched = 0;
    let updated = 0;
    aggregatedResults.testResults.forEach(result => {
      if (result.snapshotsAdded) {
        filesAdded++;
      }
      if (result.snapshotFileDeleted) {
        filesRemoved++;
      }
      if (result.snapshotsUnmatched) {
        filesUnmatched++;
      }
      if (result.snapshotsUpdated) {
        filesUpdated++;
      }
      if (result.hasUncheckedKeys) {
        unchecked++;
      }
      added += result.snapshotsAdded;
      matched += result.snapshotsMatched;
      unmatched += result.snapshotsUnmatched;
      updated += result.snapshotsUpdated;
    });
    return {
      added,
      didUpdate: aggregatedResults.didUpdate,
      filesAdded,
      filesRemoved,
      filesUnmatched,
      filesUpdated,
      matched,
      total: matched + added + updated,
      unchecked,
      unmatched,
      updated,
    };
  }

  _printSnapshotSummary(snapshots: SnapshotSummary) {
    if (
      snapshots.added ||
      snapshots.filesRemoved ||
      snapshots.unchecked ||
      snapshots.unmatched ||
      snapshots.updated
    ) {
      this.log('\n' + SNAPSHOT_SUMMARY('Snapshot Summary'));
      if (snapshots.added) {
        this.log(
          '\u203A ' +
          SNAPSHOT_ADDED(pluralize('snapshot', snapshots.added)) +
          ` written in ${pluralize('test file', snapshots.filesAdded)}.`,
        );
      }

      if (snapshots.unmatched) {
        this.log(
          '\u203A ' +
          FAIL_COLOR(pluralize('snapshot test', snapshots.unmatched)) +
          ` failed in ${pluralize('test file', snapshots.filesUnmatched)}. ` +
          'Inspect your code changes or re-run with `-u` to update them.',
        );
      }

      if (snapshots.updated) {
        this.log(
          '\u203A ' +
          SNAPSHOT_UPDATED(pluralize('snapshot', snapshots.updated)) +
          ` updated in ${pluralize('test file', snapshots.filesUpdated)}.`,
        );
      }

      if (snapshots.filesRemoved) {
        this.log(
          '\u203A ' +
          SNAPSHOT_REMOVED(pluralize(
            'snapshot file',
            snapshots.filesRemoved,
          )) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, re-run with `-u` to remove ' +
              (snapshots.filesRemoved === 1 ? 'it' : 'them.') + '.'),
        );
      }

      if (snapshots.unchecked) {
        this.log(
          '\u203A ' +
          FAIL_COLOR(pluralize('obsolete snapshot', snapshots.unchecked)) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, re-run with `-u` to remove ' +
              (snapshots.filesRemoved === 1 ? 'it' : 'them') + '.'),
        );
      }

      this.log(''); // print empty line
    }
  }

  _printSummary(aggregatedResults: AggregatedResult) {
    // If there were any failing tests and there was a large number of tests
    // executed, re-print the failing results at the end of execution output.
    const failedTests = aggregatedResults.numFailedTests;
    const runtimeErrors = aggregatedResults.numRuntimeErrorTestSuites;
    if (
      failedTests + runtimeErrors > 0 &&
      aggregatedResults.numTotalTestSuites > TEST_SUMMARY_THRESHOLD
    ) {
      this.log(chalk.bold('\nSummary of all failing tests'));
      aggregatedResults.testResults.forEach(testResult => {
        if (
          testResult.message &&
          (
            testResult.numFailingTests > 0 ||
            testResult.testExecError
          )
        ) {
          this._write(testResult.message);
        }
      });
      this.log(''); // print empty line
    }
  }
}

module.exports = SummareReporter;
