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

class VerboseReporter extends DefaultReporter {
  static groupTestsBySuites(testResults: Array<AssertionResult>) {
    const root = {suites: [], tests: [], title: ''};

    testResults.forEach(testResult => {
      let targetSuite = root;

      // Find the target suite for this test,
      // creating nested suites as necessary.
      for (const title of testResult.ancestorTitles) {
        let matchingSuite = targetSuite.suites.find(s => s.title === title);
        if (!matchingSuite) {
          matchingSuite = {title, suites: [], tests: []};
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
    testResult: TestResult,
    results: AggregatedResult,
  ) {
    this._clearWaitingOn(config);
    this._printTestFileHeaderAndFailures(config, testResult);
    if (!testResult.testExecError) {
      this._logTestResults(testResult.testResults);
    }
    this._printWaitingOn(results, config);
  }


  _logTestResults(testResults: Array<AssertionResult>) {
    this._logSuite(VerboseReporter.groupTestsBySuites(testResults), 0);
    this._logLine();
  }

  _logSuite(suite: Suite, indentLevel: number) {
    if (suite.title) {
      this._logLine(suite.title, indentLevel);
    }

    suite.tests.forEach(test => this._logTest(test, indentLevel + 1));
    suite.suites.forEach(suite => this._logSuite(suite, indentLevel + 1));
  }

  _getIcon(status: string) {
    if (status === 'failed') {
      return chalk.red('\u2715');
    } else if (status === 'pending') {
      return chalk.yellow('\u25CB');
    } else {
      return chalk.green('\u2713');
    }
  }

  _logTest(test: AssertionResult, indentLevel: number) {
    const status = this._getIcon(test.status);
    const time = test.duration
      ? ` (${test.duration.toFixed(0)}ms)`
      : '';
    this._logLine(status + ' ' + chalk.gray(test.title + time), indentLevel);
  }

  _logLine(str?: string, indentLevel?: number) {
    const indentation = '  '.repeat(indentLevel || 0);
    process.stderr.write(indentation + (str || '') + '\n');
  }
}

module.exports = VerboseReporter;
