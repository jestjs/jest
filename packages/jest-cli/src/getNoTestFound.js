// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import chalk from 'chalk';
import pluralize from './pluralize';

export default function getNoTestFound(testRunData, globalConfig): string {
  const testFiles = testRunData.reduce(
    (current, testRun) => current + testRun.matches.total || 0,
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
    'Pass `--passWithNoTests` to exit with code 0' +
    '\n' +
    `In ${chalk.bold(process.cwd())}` +
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
