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

const {formatTestResults} = require('jest-util');

function summarize(coverageMap: CoverageMap, filterBy: Array<string>) {
  let summaries = Object.create(null);

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

  if (filterBy.length) {
    summaries = filterBy.reduce((result, file) => {
      result[file] = summaries[file];
      return result;
    }, {});
  }
  return summaries;
}

module.exports = function(results: AggregatedResult): PhabricatorReport {
  // use findRelatedTests to understand which file we want to have coverage
  const filterBy = (
    process.argv.slice(process.argv.indexOf('--findRelatedTests'))
  );

  let coverageMap;
  if (results.coverageMap) {
    const coverageMap = summarize(results.coverageMap, filterBy);
  }

  const formatter = (coverage, reporter) => {
    return coverageMap;
  };

  const report = formatTestResults(results, formatter);

  return Object.assign({}, {
    phabricatorReport: report.testResults
  }, results, {coverageMap: null});

};
