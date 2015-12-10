/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const formatFailureMessage = require('./lib/utils').formatFailureMessage;
const path = require('path');
const VerboseLogger = require('./lib/testLogger');

// Explicitly reset for these messages since they can get written out in the
// middle of error logging (should have listened to Spengler and not crossed the
// streams).
const FAIL_COLOR = chalk.reset.bold.bgRed;
const PASS_COLOR = chalk.reset.bold.bgGreen;

const FAIL_RESULTS_COLOR = chalk.bold.red;
const PASS_RESULTS_COLOR = chalk.bold.green;
const RUNNING_TEST_COLOR = chalk.bold.gray;
const TEST_NAME_COLOR = chalk.bold;
const LONG_TEST_COLOR = FAIL_COLOR;

class DefaultTestReporter {

  constructor(customProcess) {
    this._process = customProcess || process;
  }

  log(str) {
    this._process.stdout.write(str + '\n');
  }

  onRunStart(config, aggregatedResults) {
    this._config = config;
    this._printWaitingOn(aggregatedResults);
    if (this._config.verbose) {
      const verboseLogger = new VerboseLogger(this._config, this._process);
      this.verboseLog = verboseLogger.verboseLog.bind(verboseLogger);
    }
  }

  onTestResult(config, testResult, aggregatedResults) {
    this._clearWaitingOn();

    const pathStr =
      config.rootDir
      ? path.relative(config.rootDir, testResult.testFilePath)
      : testResult.testFilePath;
    const allTestsPassed = testResult.numFailingTests === 0;
    const testRunTime =
      testResult.perfStats
      ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
      : null;

    const testDetail = [];
    if (testRunTime !== null) {
      testDetail.push(
        testRunTime > 2.5
          ? LONG_TEST_COLOR(testRunTime + 's')
          : testRunTime + 's'
      );
    }

    if (testResult.memoryUsage) {
      const toMB = bytes => Math.floor(bytes / 1024 / 1024);
      testDetail.push(
        `${toMB(testResult.memoryUsage)} MB current`,
        `${toMB(testResult.maxMemoryUsage)} MB max`
      );
    }

    const resultHeader = this._getResultHeader(allTestsPassed, pathStr, [
      (testDetail.length ? '(' + testDetail.join(', ') + ')' : null),
    ]);

    /*
    if (config.collectCoverage) {
      // TODO: Find a nice pretty way to print this out
    }
    */

    this.log(resultHeader);
    if (config.verbose) {
      this.verboseLog(testResult.testResults, resultHeader);
    }

    if (!allTestsPassed) {
      const failureMessage = formatFailureMessage(testResult, {
        rootPath: config.rootDir,
        useColor: !config.noHighlight,
      });
      if (config.verbose) {
        aggregatedResults.postSuiteHeaders.push(
          resultHeader,
          failureMessage
        );
      } else {
        // If we write more than one character at a time it is possible that
        // node exits in the middle of printing the result.
        // If you are reading this and you are from the future, this might not
        // be true any more.
        for (let i = 0; i < failureMessage.length; i++) {
          this._process.stdout.write(failureMessage.charAt(i));
        }
        this._process.stdout.write('\n');
      }

      if (config.bail) {
        this.onRunComplete(config, aggregatedResults);
        this._process.exit(1);
      }
    }

    this._printWaitingOn(aggregatedResults);
  }

  onRunComplete(config, aggregatedResults) {
    const numTotalTestSuites = aggregatedResults.numTotalTestSuites;
    const numFailedTests = aggregatedResults.numFailedTests;
    const numPassedTests = aggregatedResults.numPassedTests;
    const numTotalTests = aggregatedResults.numTotalTests;
    const runTime = (Date.now() - aggregatedResults.startTime) / 1000;

    if (numTotalTests === 0) {
      return;
    }

    if (config.verbose) {
      if (aggregatedResults.postSuiteHeaders.length > 0) {
        this.log(aggregatedResults.postSuiteHeaders.join('\n'));
      }
    }

    let results = '';
    if (numFailedTests) {
      results += FAIL_RESULTS_COLOR(
        numFailedTests + ' test' +
        (numFailedTests === 1 ? '' : 's') + ' failed'
      );
      results += ', ';
    }

    if (aggregatedResults.numRuntimeErrorTestSuites) {
      results += FAIL_RESULTS_COLOR(
        aggregatedResults.numRuntimeErrorTestSuites + ' test suite' +
        (aggregatedResults.numRuntimeErrorTestSuites === 1 ? '' : 's') +
        ' failed'
      );
      results += ', ';
    }

    results += PASS_RESULTS_COLOR(
      numPassedTests + ' test' + (numPassedTests === 1 ? '' : 's') + ' passed'
    );

    results += ' (' + numTotalTests + ' total in ' +
      numTotalTestSuites + ' ' +
      'test suite' + (numTotalTestSuites === 1 ? '' : 's') +
      ', run time ' + runTime + 's)';

    this.log(results);
  }

  _clearWaitingOn() {
    // Don't write special chars in noHighlight mode
    // to get clean output for logs.
    const command = this._config.noHighlight
      ? '\n'
      : '\r\x1B[K';
    this._process.stdout.write(command);
  }

  _getResultHeader(passed, testName, columns) {
    const passFailTag = passed ? PASS_COLOR(' PASS ') : FAIL_COLOR(' FAIL ');

    return [
      passFailTag,
      TEST_NAME_COLOR(testName),
    ].concat(columns || []).join(' ');
  }

  _printWaitingOn(aggregatedResults) {
    const completedTestSuites =
      aggregatedResults.numPassedTestSuites +
      aggregatedResults.numFailedTestSuites +
      aggregatedResults.numRuntimeErrorTestSuites;
    const remainingTestSuites =
      aggregatedResults.numTotalTestSuites -
      completedTestSuites;
    if (remainingTestSuites > 0) {
      const pluralTestSuites =
        remainingTestSuites === 1 ? 'test suite' : 'test suites';
      this._process.stdout.write(
        RUNNING_TEST_COLOR(
          'Running ' + remainingTestSuites + ' ' + pluralTestSuites + '...'
        )
      );
    }
  }

}

module.exports = DefaultTestReporter;
