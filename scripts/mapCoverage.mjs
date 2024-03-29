/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Because we have a build step, sometimes we can test files from both
 * `packages/jest-whatever/build/*` and `packages/jest-whatever/src/*`
 *
 * If we require file by its relative path like:
 *    // inside `jest-whatever/src/__tests__/index.js`
 *    require('../index.js'); // this will require `jest-whatever/src/index.js`
 *
 * But if we require it by a package name, this will go through node_modules
 * and lerna index.js link. So the actual file will be required from `build/`
 *    // inside another packages
 *    // this will go through lerna and require `jest-whatever/build/index.js
 *    require('jest-whatever')
 *
 * these files are identical (one is preprocessed, another is transformed on
 * the fly), but the coverage paths are different.
 * This script will map coverage results from both locations to one and
 * produce a full coverage report.
 */

import {createRequire} from 'module';
import istanbulCoverage from 'istanbul-lib-coverage';
import istanbulReport from 'istanbul-lib-report';
import istanbulReports from 'istanbul-reports';
const require = createRequire(import.meta.url);
const coverage = require('../coverage/coverage-final.json');

const map = istanbulCoverage.createCoverageMap();

const mapFileCoverage = fileCoverage => {
  fileCoverage.path = fileCoverage.path.replace(
    /(.*packages\/.*\/)(build)(\/.*)/,
    '$1src$3',
  );
  return fileCoverage;
};

for (const filename of Object.keys(coverage))
  map.addFileCoverage(mapFileCoverage(coverage[filename]));

const context = istanbulReport.createContext({coverageMap: map});

for (const reporter of ['json', 'lcov', 'text'])
  istanbulReports.create(reporter, {}).execute(context);
