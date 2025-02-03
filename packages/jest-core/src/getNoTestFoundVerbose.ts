/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {Config} from '@jest/types';
import {pluralize} from 'jest-util';
import type {Stats, TestRunData} from './types';

export default function getNoTestFoundVerbose(
  testRunData: TestRunData,
  globalConfig: Config.GlobalConfig,
  willExitWith0: boolean,
): string {
  const individualResults = testRunData.map(testRun => {
    const stats = testRun.matches.stats || ({} as Stats);
    const config = testRun.context.config;
    const statsMessage = (Object.keys(stats) as Array<keyof Stats>)
      .map(key => {
        if (key === 'roots' && config.roots.length === 1) {
          return null;
        }
        const value = (config as Record<string, unknown>)[key];
        if (value) {
          const valueAsString = Array.isArray(value)
            ? value.join(', ')
            : String(value);
          const matches = pluralize('match', stats[key] || 0, 'es');
          return `  ${key}: ${pc.yellow(valueAsString)} - ${matches}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');

    return testRun.matches.total
      ? `In ${pc.bold(config.rootDir)}\n` +
          `  ${pluralize(
            'file',
            testRun.matches.total || 0,
            's',
          )} checked.\n${statsMessage}`
      : `No files found in ${config.rootDir}.\n` +
          "Make sure Jest's configuration does not exclude this directory." +
          '\nTo set up Jest, make sure a package.json file exists.\n' +
          'Jest Documentation: ' +
          'https://jestjs.io/docs/configuration';
  });
  let dataMessage;

  if (globalConfig.runTestsByPath) {
    dataMessage = `Files: ${globalConfig.nonFlagArgs
      .map(p => `"${p}"`)
      .join(', ')}`;
  } else {
    dataMessage = `Pattern: ${pc.yellow(
      globalConfig.testPathPatterns.toPretty(),
    )} - 0 matches`;
  }

  if (willExitWith0) {
    return `${pc.bold(
      'No tests found, exiting with code 0',
    )}\n${individualResults.join('\n')}\n${dataMessage}`;
  }

  return (
    `${pc.bold('No tests found, exiting with code 1')}\n` +
    'Run with `--passWithNoTests` to exit with code 0' +
    `\n${individualResults.join('\n')}\n${dataMessage}`
  );
}
