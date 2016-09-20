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

import type {TestResult} from 'types/TestResult';
import type {Config} from 'types/Config';

const chalk = require('chalk');
const path = require('path');

const LONG_TEST_COLOR = chalk.reset.bold.bgRed;
// Explicitly reset for these messages since they can get written out in the
// middle of error logging
const FAIL = chalk.reset.inverse.bold.red(' FAIL ');
const PASS = chalk.reset.inverse.bold.green(' PASS ');

module.exports = (testResult: TestResult, config: Config) => {
  const pathStr = config.rootDir
    ? path.relative(config.rootDir, testResult.testFilePath)
    : testResult.testFilePath;
  const allTestsPassed = testResult.numFailingTests === 0;
  const runTime = testResult.perfStats
    ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
    : null;

  const testDetail = [];
  if (runTime !== null && runTime > 5) {
    testDetail.push(LONG_TEST_COLOR(runTime + 's'));
  }

  if (testResult.memoryUsage) {
    const toMB = bytes => Math.floor(bytes / 1024 / 1024);
    testDetail.push(`${toMB(testResult.memoryUsage)} MB heap size`);
  }

  const dirname = path.dirname(pathStr);
  const basename = path.basename(pathStr);
  const testFileStr = chalk.dim(dirname + path.sep) + chalk.bold(basename);
  return `${allTestsPassed ? PASS : FAIL} ${testFileStr}` +
  (testDetail.length ? ` (${testDetail.join(', ')})` : '');
};
