/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TestResult} from '@jest/types';

type PhabricatorReport = TestResult.AggregatedResultWithoutCoverage & {
  coverageMap?: TestResult.CoverageMap | null;
};

function summarize(coverageMap: TestResult.CoverageMap) {
  const summaries = Object.create(null);

  coverageMap.files().forEach((file: string) => {
    const covered = [];
    const lineCoverage: any = coverageMap
      .fileCoverageFor(file)
      .getLineCoverage();

    Object.keys(lineCoverage).forEach(lineNumber => {
      // Line numbers start at one
      const number = parseInt(lineNumber, 10) - 1;
      covered[number] = lineCoverage[lineNumber] ? 'C' : 'U';
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

module.exports = function(
  results: TestResult.AggregatedResult,
): PhabricatorReport {
  return {
    ...results,
    coverageMap: results.coverageMap && summarize(results.coverageMap),
  };
};
