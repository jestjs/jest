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

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {Process} from 'types/Process';

const chalk = require('chalk');
const formatFailureMessage = require('jest-util').formatFailureMessage;
const Notifier = require('../Notifier');
const path = require('path');
const VerboseLogger = require('./VerboseLogger');

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

// Explicitly reset for these messages since they can get written out in the
// middle of error logging (should have listened to Spengler and not crossed the
// streams).
const FAIL = chalk.reset.bold.bgRed(' FAIL ');
const PASS = chalk.reset.bold.bgGreen(' PASS ');

const FAIL_COLOR = chalk.bold.red;
const LONG_TEST_COLOR = chalk.reset.bold.bgRed;
const PASS_COLOR = chalk.bold.green;
const PENDING_COLOR = chalk.bold.yellow;
const RUNNING_TEST_COLOR = chalk.bold.gray;
const SNAPSHOT_ADDED = chalk.bold.green;
const SNAPSHOT_UPDATED = chalk.bold.green;
const SNAPSHOT_REMOVED = chalk.bold.red;
const SNAPSHOT_SUMMARY = chalk.bold;
const TEST_NAME_COLOR = chalk.bold;
const TEST_SUMMARY_THRESHOLD = 20;

const pluralize = (word, count) => `${count} ${word}${count === 1 ? '' : 's'}`;

class DefaultTestReporter {

  _config: Config;
  _process: Process;
  verboseLogger: VerboseLogger;

  constructor(customProcess: Process) {
    this._process = customProcess || process;
  }

  log(message: string) {
    this._process.stdout.write(message + '\n');
  }

  onRunStart(config: Config, results: AggregatedResult) {
    this._config = config;
    this._printWaitingOn(results);
    if (this._config.verbose) {
      this.verboseLogger = new VerboseLogger(this._process);
    }
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    results: AggregatedResult,
  ) {
    this._clearWaitingOn();

    const pathStr =
      config.rootDir
      ? path.relative(config.rootDir, testResult.testFilePath)
      : testResult.testFilePath;
    const allTestsPassed = testResult.numFailingTests === 0;
    const runTime =
      testResult.perfStats
      ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
      : null;

    const testDetail = [];
    if (runTime !== null) {
      testDetail.push(
        runTime > 5 ? LONG_TEST_COLOR(runTime + 's') : runTime + 's'
      );
    }

    if (testResult.memoryUsage) {
      const toMB = bytes => Math.floor(bytes / 1024 / 1024);
      testDetail.push(`${toMB(testResult.memoryUsage)} MB heap size`);
    }

    const resultHeader =
       `${allTestsPassed ? PASS : FAIL} ${TEST_NAME_COLOR(pathStr)}` +
       (testDetail.length ? ` (${testDetail.join(', ')})` : '');

    this.log(resultHeader);
    if (config.verbose && !testResult.testExecError) {
      this.verboseLogger.logTestResults(
        testResult.testResults
      );
    }

    if (!allTestsPassed) {
      const failureMessage = formatFailureMessage(testResult, {
        noStackTrace: config.noStackTrace,
        rootDir: config.rootDir,
        verbose: config.verbose,
      });

      this._write(failureMessage);
      testResult.message = resultHeader + '\n' + failureMessage + '\n';

      if (config.bail) {
        this.onRunComplete(config, results);
        this._process.exit(1);
      }
    }

    this._printWaitingOn(results);
  }

  onRunComplete(config: Config, aggregatedResults: AggregatedResult) {
    const totalTestSuites = aggregatedResults.numTotalTestSuites;
    const failedTests = aggregatedResults.numFailedTests;
    const passedTests = aggregatedResults.numPassedTests;
    const pendingTests = aggregatedResults.numPendingTests;
    const totalTests = aggregatedResults.numTotalTests;
    const totalErrors = aggregatedResults.numRuntimeErrorTestSuites;
    const runTime = (Date.now() - aggregatedResults.startTime) / 1000;

    if (totalTests === 0 && totalErrors === 0) {
      return true;
    }

    const snapshots = this._getSnapshotSummary(aggregatedResults);
    const snapshotFailure = !!(!snapshots.didUpdate && (
      snapshots.unchecked ||
      snapshots.unmatched ||
      snapshots.filesRemoved
    ));
    this._printSnapshotSummary(snapshots);

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
    this.log(results);

    if (config.notify) {
      Notifier.onTestResults(aggregatedResults);
    }

    return snapshotFailure ? false : aggregatedResults.success;
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
          ` written in ${pluralize('test file', snapshots.filesAdded)}.`
        );
      }

      if (snapshots.unmatched) {
        this.log(
          '\u203A ' +
          FAIL_COLOR(pluralize('snapshot test', snapshots.unmatched)) +
          ` failed in ${pluralize('test file', snapshots.filesUnmatched)}. ` +
          'Inspect your code changes or re-run with `-u` to update them.'
        );
      }

      if (snapshots.updated) {
        this.log(
          '\u203A ' +
          SNAPSHOT_UPDATED(pluralize('snapshot', snapshots.updated)) +
          ` updated in ${pluralize('test file', snapshots.filesUpdated)}.`
        );
      }

      if (snapshots.filesRemoved) {
        this.log(
          '\u203A ' +
          SNAPSHOT_REMOVED(pluralize(
            'snapshot file',
            snapshots.filesRemoved
          )) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, re-run with `-u` to remove them.')
        );
      }

      if (snapshots.unchecked) {
        this.log(
          '\u203A ' +
          FAIL_COLOR(pluralize('obsolete snapshot', snapshots.unchecked)) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, re-run with `-u` to remove them.')
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

  _write(string) {
    // If we write more than one character at a time it is possible that
    // node exits in the middle of printing the result.
    // If you are reading this and you are from the future, this might not
    // be true any more.
    for (let i = 0; i < string.length; i++) {
      this._process.stdout.write(string.charAt(i));
    }
    this._process.stdout.write('\n');
  }

  _clearWaitingOn() {
    this._process.stdout.write(this._config.noHighlight ? '' : '\r\x1B[K');
  }

  _printWaitingOn(results: AggregatedResult) {
    const remaining = results.numTotalTestSuites -
      results.numPassedTestSuites -
      results.numFailedTestSuites -
      results.numRuntimeErrorTestSuites;
    if (!this._config.noHighlight && remaining > 0) {
      this._process.stdout.write(RUNNING_TEST_COLOR(
        `Running ${pluralize('test suite', remaining)}...`
      ));
    }
  }

}

module.exports = DefaultTestReporter;
