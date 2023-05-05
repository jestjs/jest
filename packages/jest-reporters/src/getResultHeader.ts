/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import {formatTime} from 'jest-util';
import formatTestPath from './formatTestPath';
import printDisplayName from './printDisplayName';

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

export default function getResultHeader(
  result: TestResult,
  globalConfig: Config.GlobalConfig,
  projectConfig?: Config.ProjectConfig,
): string {
  const testPath = result.testFilePath;
  const status =
    result.numFailingTests > 0 || result.testExecError ? FAIL : PASS;

  const testDetail = [];

  if (result.perfStats?.slow) {
    const runTime = result.perfStats.runtime / 1000;

    testDetail.push(LONG_TEST_COLOR(formatTime(runTime, 0)));
  }

  if (result.memoryUsage) {
    const toMB = (bytes: number) => Math.floor(bytes / 1024 / 1024);
    testDetail.push(`${toMB(result.memoryUsage)} MB heap size`);
  }

  const projectDisplayName =
    projectConfig && projectConfig.displayName
      ? `${printDisplayName(projectConfig)} `
      : '';

  return `${status} ${projectDisplayName}${formatTestPath(
    projectConfig ?? globalConfig,
    testPath,
  )}${testDetail.length ? ` (${testDetail.join(', ')})` : ''}`;
}
