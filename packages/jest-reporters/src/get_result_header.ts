/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {TestResult} from '@jest/test-result';
import chalk = require('chalk');
import {formatTestPath, printDisplayName} from './utils';
import terminalLink = require('terminal-link');

const LONG_TEST_COLOR = chalk.reset.bold.bgRed;
// Explicitly reset for these messages since they can get written out in the
// middle of error logging
const FAIL_TEXT = 'FAIL';
const PASS_TEXT = 'PASS';

const FAIL = chalk.supportsColor
  ? chalk.reset.inverse.bold.red(` ${FAIL_TEXT} `)
  : FAIL_TEXT;

const PASS = chalk.supportsColor
  ? chalk.reset.inverse.bold.green(` ${PASS_TEXT} `)
  : PASS_TEXT;

export default (
  result: TestResult,
  globalConfig: Config.GlobalConfig,
  projectConfig?: Config.ProjectConfig,
) => {
  const testPath = result.testFilePath;
  const formattedTestPath = formatTestPath(
    projectConfig ? projectConfig : globalConfig,
    testPath,
  );
  const fileLink = terminalLink(formattedTestPath, `file://${testPath}`, {
    fallback: () => formattedTestPath,
  });
  const status =
    result.numFailingTests > 0 || result.testExecError ? FAIL : PASS;

  const runTime = result.perfStats
    ? (result.perfStats.end - result.perfStats.start) / 1000
    : null;

  const testDetail = [];
  if (runTime !== null && runTime > 5) {
    testDetail.push(LONG_TEST_COLOR(runTime + 's'));
  }

  if (result.memoryUsage) {
    const toMB = (bytes: number) => Math.floor(bytes / 1024 / 1024);
    testDetail.push(`${toMB(result.memoryUsage)} MB heap size`);
  }

  const projectDisplayName =
    projectConfig && projectConfig.displayName
      ? printDisplayName(projectConfig) + ' '
      : '';

  return (
    `${status} ${projectDisplayName}${fileLink}` +
    (testDetail.length ? ` (${testDetail.join(', ')})` : '')
  );
};
