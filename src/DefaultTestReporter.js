/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const colors = require('./lib/colors');
const formatFailureMessage = require('./lib/utils').formatFailureMessage;
const formatMsg = require('./lib/utils').formatMsg;
const path = require('path');
const VerboseLogger = require('./lib/testLogger');

const FAIL_COLOR = colors.RED_BG + colors.BOLD;
const PASS_COLOR = colors.GREEN_BG + colors.BOLD;
const TEST_NAME_COLOR = colors.BOLD;

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

    let testDetail = [];
    if (testRunTime !== null) {
      testDetail.push(
        testRunTime > 2.5
          ? this._formatMsg(testRunTime + 's', FAIL_COLOR)
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
        this._process.exit(0);
      }
    }

    this._printWaitingOn(aggregatedResults);
  }

  onRunComplete(config, aggregatedResults) {
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
      results += this._formatMsg(
        numFailedTests + ' test' +
        (numFailedTests === 1 ? '' : 's') + ' failed',
        colors.RED + colors.BOLD
      );
      results += ', ';
    }

    if (aggregatedResults.numRuntimeErrorTestSuites) {
      results += this._formatMsg(
        aggregatedResults.numRuntimeErrorTestSuites + ' test suite' +
          (aggregatedResults.numRuntimeErrorTestSuites === 1 ? '' : 's') +
          ' failed',
        colors.RED + colors.BOLD
      );
      results += ', ';
    }

    results += this._formatMsg(
      numPassedTests + ' test' + (numPassedTests === 1 ? '' : 's') + ' passed',
      colors.GREEN + colors.BOLD
    );

    const numTestSuitesExecuted =
      aggregatedResults.numTotalTestSuites -
      aggregatedResults.numRuntimeErrorTestSuites;

    results += ' (' + numTotalTests + ' total in ' +
      numTestSuitesExecuted + ' ' +
      'test suite' + (numTestSuitesExecuted === 1 ? '' : 's') +
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

  _formatMsg(msg, color) {
    return formatMsg(msg, color, this._config);
  }

  _getResultHeader(passed, testName, columns) {
    const passFailTag = passed
      ? this._formatMsg(' PASS ', PASS_COLOR)
      : this._formatMsg(' FAIL ', FAIL_COLOR);

    return [
      passFailTag,
      this._formatMsg(testName, TEST_NAME_COLOR),
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
        this._formatMsg(
          'Running ' + remainingTestSuites + ' ' + pluralTestSuites + '...',
          colors.GRAY + colors.BOLD
        )
      );
    }
  }

}

module.exports = DefaultTestReporter;
