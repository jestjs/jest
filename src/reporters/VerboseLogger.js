/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');

class VerboseLogger {
  constructor(customProcess) {
    this._process = customProcess || process;
  }

  logTestResults(testResults) {
    groupTestsBySuites(testResults).forEach(suite =>
      this._logSuite(suite, 0)
    );

    this._logLine();
  }

  _logSuite(suite, indentLevel) {
    this._logLine(suite.title, indentLevel);

    suite.tests.forEach(test =>
      this._logTest(test, indentLevel + 1)
    );

    suite.suites.forEach(childSuite =>
      this._logSuite(childSuite, indentLevel + 1)
    );
  }

  _getIcon(status) {
    if (status === 'failed') {
      return chalk.red('\u2715');
    } else if (status === 'pending') {
      return chalk.yellow('\u25CB');
    } else {
      return chalk.green('\u2713');
    }
  }

  _logTest(test, indentLevel) {
    const status = this._getIcon(test.status);
    this._logLine(`${status} ${chalk.gray(test.title)}`, indentLevel);
  }

  _logLine(str, indentLevel) {
    str = str || '';
    indentLevel = indentLevel || 0;

    const indentation = '  '.repeat(indentLevel);
    this._process.stdout.write(`${indentation}${str}\n`);
  }
}

function groupTestsBySuites(testResults) {
  const root = { suites: [] };

  testResults.forEach(testResult => {
    let targetSuite = root;

    // Find the target suite for this test,
    // creating nested suites as necessary.
    for (const title of testResult.ancestorTitles) {
      let matchingSuite = targetSuite.suites.find(s => s.title === title);
      if (!matchingSuite) {
        matchingSuite = { title, suites: [], tests: [] };
        targetSuite.suites.push(matchingSuite);
      }
      targetSuite = matchingSuite;
    }

    targetSuite.tests.push(testResult);
  });

  return root.suites;
}

VerboseLogger.groupTestsBySuites = groupTestsBySuites;
module.exports = VerboseLogger;
