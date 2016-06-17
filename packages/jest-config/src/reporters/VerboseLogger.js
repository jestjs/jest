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

import type {
  AssertionResult,
  Suite,
} from 'types/TestResult';
import type {Process} from 'types/Process';

const chalk = require('chalk');

class VerboseLogger {
  _process: Process;

  constructor(customProcess?: ?Process) {
    this._process = customProcess || process;
  }

  static groupTestsBySuites(testResults: Array<AssertionResult>) {
    const root: Suite = {
      suites: [],
      tests: [],
      title: 'Root Suite',
    };

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

    return root.suites;
  }

  logTestResults(testResults: Array<AssertionResult>) {
    VerboseLogger.groupTestsBySuites(testResults).forEach(suite =>
      this._logSuite(suite, 0)
    );

    this._logLine();
  }

  _logSuite(suite: Suite, indentLevel: number) {
    this._logLine(suite.title, indentLevel);

    suite.tests.forEach(test =>
      this._logTest(test, indentLevel + 1)
    );

    suite.suites.forEach(childSuite =>
      this._logSuite(childSuite, indentLevel + 1)
    );
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
    this._logLine(status + chalk.gray(test.title), indentLevel);
  }

  _logLine(str?: string, indentLevel?: number) {
    const indentation = '  '.repeat(indentLevel || 0);
    this._process.stdout.write(indentation + (str || '') + '\n');
  }
}

module.exports = VerboseLogger;
