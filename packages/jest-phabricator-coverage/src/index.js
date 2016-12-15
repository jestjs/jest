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
  TestResult
} from 'types/TestResult';

type PhabricatorReport = {
  phabricatorReport: Array<Object>
};

function formatResults(
  testResult: TestResult, coverageMap?: CoverageMap
): Object {
  const file = testResult.testFilePath;
  const output: Object = {
    coverage: {},
    message: '',
    name: file,
    summary: '',
  };

  if (testResult.testExecError) {
    const currTime = Date.now();
    output.status = 'fatal';
    output.startTime = currTime;
    output.endTime = currTime;
  } else {
    const allTestsPassed = testResult.numFailingTests === 0;
    output.status = allTestsPassed ? 'passed' : 'failed';
    output.startTime = testResult.perfStats.start;
    output.endTime = testResult.perfStats.end;
    if (coverageMap) {
      output.coverage = summarize(coverageMap);
    } else {
      output.coverage = Object.create(null);
    }
  }

  return output;
}

function summarize(coverageMap: CoverageMap) {
  const summaries = Object.create(null);

  coverageMap.files().forEach(file => {
    const covered = [];
    const lineCoverage = coverageMap.fileCoverageFor(file).getLineCoverage();

    Object.keys(lineCoverage).forEach(lineNumber => {
      // Line numbers start at one
      const number = (parseInt(lineNumber, 10) - 1);
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

  const report = results.testResults.map(
    test => formatResults(test, results.coverageMap)
  );

  return Object.assign({}, {
    phabricatorReport: report
  }, results, {coverageMap: null});

};
