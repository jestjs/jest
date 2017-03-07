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

import type {Config} from 'types/Config';
import type {
  AggregatedResult,
  AssertionResult,
  Suite,
  TestResult,
} from 'types/TestResult';

const DefaultReporter = require('./DefaultReporter');
const chalk = require('chalk');
const {ICONS} = require('../constants');

class VerboseReporter extends DefaultReporter {
  _config: Config;

  constructor(config: Config) {
    super();
    this._config = config;
  }

  static filterTestResults(testResults: Array<AssertionResult>) {
    return testResults.filter(({status}) => status !== 'pending');
  }

  static groupTestsBySuites(testResults: Array<AssertionResult>) {
    const root = {suites: [], tests: [], title: ''};
    testResults.forEach(testResult => {
      let targetSuite = root;

      // Find the target suite for this test,
      // creating nested suites as necessary.
      for (const title of testResult.ancestorTitles) {
        let matchingSuite = targetSuite.suites.find(s => s.title === title);
        if (!matchingSuite) {
          matchingSuite = {suites: [], tests: [], title};
          targetSuite.suites.push(matchingSuite);
        }
        targetSuite = matchingSuite;
      }

      targetSuite.tests.push(testResult);
    });
    return root;
  }

  onTestResult(
    config: Config,
    result: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    super.onTestResult(config, result, aggregatedResults);
    if (!result.testExecError && !result.skipped) {
      this._logTestResults(result.testResults);
    }
  }

  _logTestResults(testResults: Array<AssertionResult>) {
    this._logSuite(VerboseReporter.groupTestsBySuites(testResults), 0);
    this._logLine();
  }

  _logSuite(suite: Suite, indentLevel: number) {
    if (suite.title) {
      this._logLine(suite.title, indentLevel);
    }

    this._logTests(suite.tests, indentLevel + 1);

    suite.suites.forEach(suite => this._logSuite(suite, indentLevel + 1));
  }

  _getIcon(status: string) {
    if (status === 'failed') {
      return chalk.red(ICONS.failed);
    } else if (status === 'pending') {
      return chalk.yellow(ICONS.pending);
    } else {
      return chalk.green(ICONS.success);
    }
  }

  _logTest(test: AssertionResult, indentLevel: number) {
    const status = this._getIcon(test.status);
    const time = test.duration ? ` (${test.duration.toFixed(0)}ms)` : '';
    this._logLine(status + ' ' + chalk.dim(test.title + time), indentLevel);
  }

  _logTests(tests: Array<AssertionResult>, indentLevel: number) {
    const config = this._config;

    if (config.expand) {
      tests.forEach(test => this._logTest(test, indentLevel));
    } else {
      const skippedCount = tests.reduce((result, test) => {
        if (test.status === 'pending') {
          result += 1;
        } else {
          this._logTest(test, indentLevel);
        }

        return result;
      }, 0);

      if (skippedCount > 0) {
        this._logSkippedTests(skippedCount, indentLevel);
      }
    }
  }

  _logSkippedTests(count: number, indentLevel: number) {
    const icon = this._getIcon('pending');
    const text = chalk.dim(`skipped ${count} test${count === 1 ? '' : 's'}`);

    this._logLine(`${icon} ${text}`, indentLevel);
  }

  _logLine(str?: string, indentLevel?: number) {
    const indentation = '  '.repeat(indentLevel || 0);
    this.log(indentation + (str || ''));
  }
}

module.exports = VerboseReporter;
