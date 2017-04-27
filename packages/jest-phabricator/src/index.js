/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

import type {
  AggregatedResult,
  CoverageMap,
  FormattedTestResult,
} from 'types/TestResult';

type PhabricatorReport = AggregatedResult & {
  phabricatorReport: Array<FormattedTestResult>,
};

const {formatTestResults} = require('jest-util');

function summarize(coverageMap: CoverageMap) {
  const summaries = Object.create(null);

  coverageMap.files().forEach(file => {
    const covered = [];
    const lineCoverage = coverageMap.fileCoverageFor(file).getLineCoverage();

    Object.keys(lineCoverage).forEach(lineNumber => {
      // Line numbers start at one
      const number = parseInt(lineNumber, 10) - 1;
      const visited = !!lineCoverage[lineNumber];
      covered[number] = visited ? 'C' : 'U';
    });

    for (let i = 0; i < covered.length; i++) {
      if (!covered[i]) {
        covered[i] = 'N';
      }
    }

    summaries[file] = covered.join('');
  });

  return summaries;
}

module.exports = function(results: AggregatedResult): PhabricatorReport {
  const coverageMap = results.coverageMap && summarize(results.coverageMap);

  const formatter = (coverage, reporter) => coverageMap;
  const report = formatTestResults(results, formatter);

  const returnPhabricatorReport: PhabricatorReport = {
    aggregatedResult: results, 
    // Remove the coverageMap here as it uses a lot of memory.
    coverageMap: null,
    formattedTestResults: report.testResults,
    numFailedTestSuites: results.numFailedTestSuites,
    numFailedTests: results.numFailedTests,
    numPassedTestSuites: results.numPassedTestSuites,
    numPassedTests: results.numPassedTests,
    numPendingTestSuites: results.numPendingTestSuites,
    numPendingTests: results.numPendingTests,
    numRuntimeErrorTestSuites: results.numRuntimeErrorTestSuites,
    numTotalTestSuites: results.numTotalTestSuites,
    numTotalTests: results.numTotalTests,
    phabricatorReport: report.testResults,
    snapshot: results.snapshot,
    startTime: results.startTime,
    success: results.success,
    testResults: results.testResults,
    wasInterrupted: results.wasInterrupted,
  };

  return returnPhabricatorReport;
};
