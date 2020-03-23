/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AggregatedResult} from '@jest/test-result';

type CoverageMap = AggregatedResult['coverageMap'];

function summarize(coverageMap: CoverageMap): CoverageMap {
  if (!coverageMap) {
    return coverageMap;
  }

  const summaries = Object.create(null);

  coverageMap.files().forEach(file => {
    const covered = [];
    const lineCoverage = coverageMap.fileCoverageFor(file).getLineCoverage();

    Object.keys(lineCoverage).forEach(lineNumber => {
      const number = parseInt(lineNumber, 10);
      // Line numbers start at one
      covered[number - 1] = lineCoverage[number] ? 'C' : 'U';
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

export = function (results: AggregatedResult): AggregatedResult {
  return {...results, coverageMap: summarize(results.coverageMap)};
};
