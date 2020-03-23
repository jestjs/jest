/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import type {TestRunData} from './types';
import pluralize from './pluralize';

export default function getNoTestFound(
  testRunData: TestRunData,
  globalConfig: Config.GlobalConfig,
): string {
  const testFiles = testRunData.reduce(
    (current, testRun) => current + (testRun.matches.total || 0),
    0,
  );
  let dataMessage;

  if (globalConfig.runTestsByPath) {
    dataMessage = `Files: ${globalConfig.nonFlagArgs
      .map(p => `"${p}"`)
      .join(', ')}`;
  } else {
    dataMessage = `Pattern: ${chalk.yellow(
      globalConfig.testPathPattern,
    )} - 0 matches`;
  }

  return (
    chalk.bold('No tests found, exiting with code 1') +
    '\n' +
    'Run with `--passWithNoTests` to exit with code 0' +
    '\n' +
    `In ${chalk.bold(globalConfig.rootDir)}` +
    '\n' +
    `  ${pluralize('file', testFiles, 's')} checked across ${pluralize(
      'project',
      testRunData.length,
      's',
    )}. Run with \`--verbose\` for more details.` +
    '\n' +
    dataMessage
  );
}
