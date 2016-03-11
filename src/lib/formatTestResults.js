/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const utils = require('./utils');

const formatResult = (testResult, codeCoverageFormatter, reporter) => {
  const output = {
    name: testResult.testFilePath,
    summary: '', // TODO
    message: '',
  };

  if (testResult.testExecError) {
    const currTime = Date.now();
    output.status = 'failed';
    output.message = testResult.testExecError;
    output.startTime = currTime;
    output.endTime = currTime;
    output.coverage = {};
  } else {
    const allTestsPassed = testResult.numFailingTests === 0;
    output.status = allTestsPassed ? 'passed' : 'failed';
    output.startTime = testResult.perfStats.start;
    output.endTime = testResult.perfStats.end;
    output.coverage = codeCoverageFormatter(testResult.coverage, reporter);

    if (!allTestsPassed) {
      output.message = utils.formatFailureMessage(testResult, {
        rootPath: '',
        useColor: false,
      });
    }
  }

  return output;
};

/**
 * @callback codeCoverageFormatter
 * @param {*} results
 * @param {*} reporter - an instance of the testReporter
 */

/**
 * Formats the test results.
 * @param {*} results - a results hash determined by the reporter
 * @param {codeCoverageFormatter} codeCoverageFormatter
 * @param {*} reporter - an instance of the testReporter
 * @returns {{success: *, startTime: (*|number|Number),
 *  numTotalTests: *,
 *  numTotalTestSuites: *,
 *  numRuntimeErrorTestSuites: *,
 *  numPassedTests: *,
 *  numFailedTests: *,
 *  numPendingTests: *,
 *  testResults: (*|{}|Array),
 *  postSuiteHeaders: *}}
 */

function formatTestResults(results, codeCoverageFormatter, reporter) {
  if (!codeCoverageFormatter) {
    codeCoverageFormatter = coverage => coverage;
  }

  const testResults = results.testResults.map(
    testResult => formatResult(testResult, codeCoverageFormatter, reporter)
  );

  return {
    success: results.success,
    startTime: results.startTime,
    numTotalTests: results.numTotalTests,
    numTotalTestSuites: results.numTotalTestSuites,
    numRuntimeErrorTestSuites: results.numRuntimeErrorTestSuites,
    numPassedTests: results.numPassedTests,
    numFailedTests: results.numFailedTests,
    numPendingTests: results.numPendingTests,
    testResults,
    postSuiteHeaders: results.postSuiteHeaders,
  };
}

module.exports = formatTestResults;
