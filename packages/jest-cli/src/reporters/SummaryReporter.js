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

import type {AggregatedResult, SnapshotSummary} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {RunnerContext} from 'types/Reporters';

const BaseReporter = require('./BaseReporter');

const chalk = require('chalk');
const getResultHeader = require('./getResultHeader');

const ARROW = ' \u203A ';
const FAIL_COLOR = chalk.bold.red;
const PASS_COLOR = chalk.bold.green;
const PENDING_COLOR = chalk.bold.yellow;
const SNAPSHOT_ADDED = chalk.bold.green;
const SNAPSHOT_NOTE = chalk.dim;
const SNAPSHOT_REMOVED = chalk.bold.red;
const SNAPSHOT_SUMMARY = chalk.bold;
const SNAPSHOT_UPDATED = chalk.bold.green;
const TEST_SUMMARY_THRESHOLD = 20;

const pluralize = (word, count) => `${count} ${word}${count === 1 ? '' : 's'}`;

class SummareReporter extends BaseReporter {
  onRunComplete(
    config: Config,
    aggregatedResults: AggregatedResult,
    runnerContext: RunnerContext,
  ) {
    const totalTestSuites = aggregatedResults.numTotalTestSuites;
    const failedTests = aggregatedResults.numFailedTests;
    const passedTests = aggregatedResults.numPassedTests;
    const pendingTests = aggregatedResults.numPendingTests;
    const totalTests = aggregatedResults.numTotalTests;
    const totalErrors = aggregatedResults.numRuntimeErrorTestSuites;
    const runTime = (Date.now() - aggregatedResults.startTime) / 1000;

    const snapshots = aggregatedResults.snapshot;
    const arrowColor = (snapshots.failure || failedTests || totalErrors)
      ? FAIL_COLOR
      : PASS_COLOR;

    let results = chalk.bold('Test Summary') + '\n' +
      ARROW + runnerContext.getTestSummary() + '\n' + arrowColor(ARROW);
    if (snapshots.failure) {
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

    this._printSummary(aggregatedResults, config);
    this._printSnapshotSummary(snapshots, config);
    if (totalTestSuites) {
      results +=
        `${PASS_COLOR(`${pluralize('test', passedTests)} passed`)} (` +
        `${totalTests} total in ${pluralize('test suite', totalTestSuites)}, ` +
        (snapshots.total ? pluralize('snapshot', snapshots.total) + ', ' : '') +
        `run time ${runTime}s)`;
      this.log(results);
    }
  }

  _printSnapshotSummary(snapshots: SnapshotSummary, config: Config) {
    if (
      snapshots.added ||
      snapshots.filesRemoved ||
      snapshots.unchecked ||
      snapshots.unmatched ||
      snapshots.updated
    ) {
      let updateCommand;
      const event = process.env.npm_lifecycle_event;
      if (config.watch) {
        updateCommand = 'press `u`';
      } else if (event) {
        updateCommand = `run with \`npm ${event} -- -u\``;
      } else {
        updateCommand = 're-run with `-u`';
      }

      this.log('\n' + SNAPSHOT_SUMMARY('Snapshot Summary'));
      if (snapshots.added) {
        this.log(
          SNAPSHOT_ADDED(ARROW + pluralize('snapshot', snapshots.added)) +
          ` written in ${pluralize('test file', snapshots.filesAdded)}.`,
        );
      }

      if (snapshots.unmatched) {
        this.log(
          FAIL_COLOR(ARROW + pluralize('snapshot test', snapshots.unmatched)) +
          ` failed in ${pluralize('test file', snapshots.filesUnmatched)}. ` +
          SNAPSHOT_NOTE(
            'Inspect your code changes or ' +
            updateCommand + ' to update them.',
          ),
        );
      }

      if (snapshots.updated) {
        this.log(
          SNAPSHOT_UPDATED(ARROW + pluralize('snapshot', snapshots.updated)) +
          ` updated in ${pluralize('test file', snapshots.filesUpdated)}.`,
        );
      }

      if (snapshots.filesRemoved) {
        this.log(
          SNAPSHOT_REMOVED(ARROW + pluralize(
            'snapshot file',
            snapshots.filesRemoved,
          )) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, ' + updateCommand + ' to remove ' +
              (snapshots.filesRemoved === 1 ? 'it' : 'them.') + '.'),
        );
      }

      if (snapshots.unchecked) {
        this.log(
          FAIL_COLOR(ARROW + pluralize(
            'obsolete snapshot',
            snapshots.unchecked,
          )) +
          (snapshots.didUpdate
            ? ' removed.'
            : ' found, ' + updateCommand + ' to remove ' +
              (snapshots.filesRemoved === 1 ? 'it' : 'them') + '.'),
        );
      }

      this.log(''); // print empty line
    }
  }

  _printSummary(aggregatedResults: AggregatedResult, config: Config) {
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
        const {failureMessage} = testResult;
        if (failureMessage) {
          this._write(
            getResultHeader(testResult, config) + '\n' +
            failureMessage + '\n',
          );
        }
      });
      this.log(''); // print empty line
    }
  }
}

module.exports = SummareReporter;
