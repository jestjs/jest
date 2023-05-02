/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {performance} from 'perf_hooks';
import chalk = require('chalk');
import exit = require('exit');
import * as fs from 'graceful-fs';
import type {AggregatedResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import {readConfigs} from 'jest-config';
import {formatHandleErrors} from '../collectHandles';
import getConfigsOfProjectsToRun from '../getConfigsOfProjectsToRun';
import getProjectNamesMissingWarning from '../getProjectNamesMissingWarning';
import getSelectProjectsMessage from '../getSelectProjectsMessage';
import {_run} from '../jest';
import logDebugMessages from '../lib/logDebugMessages';
import pluralize from '../pluralize';

export async function runCLI(
  argv: Config.Argv,
  projects: Array<string>,
): Promise<{
  results: AggregatedResult;
  globalConfig: Config.GlobalConfig;
}> {
  performance.mark('jest/runCLI:start');

  // If we output a JSON object, we can't write anything to stdout, since
  // it'll break the JSON structure and it won't be valid.
  const outputStream =
    argv.json || argv.useStderr ? process.stderr : process.stdout;

  const {globalConfig, configs, hasDeprecationWarnings} = await readConfigs(
    argv,
    projects,
  );

  if (argv.debug) {
    logDebugMessages(globalConfig, configs, outputStream);
  }

  if (argv.showConfig) {
    logDebugMessages(globalConfig, configs, process.stdout);
    exit(0);
  }

  if (argv.clearCache) {
    // stick in a Set to dedupe the deletions
    new Set(configs.map(config => config.cacheDirectory)).forEach(
      cacheDirectory => {
        fs.rmSync(cacheDirectory, {force: true, recursive: true});
        process.stdout.write(`Cleared ${cacheDirectory}\n`);
      },
    );

    exit(0);
  }

  const configsOfProjectsToRun = getConfigsOfProjectsToRun(configs, {
    ignoreProjects: argv.ignoreProjects,
    selectProjects: argv.selectProjects,
  });
  if (argv.selectProjects || argv.ignoreProjects) {
    const namesMissingWarning = getProjectNamesMissingWarning(configs, {
      ignoreProjects: argv.ignoreProjects,
      selectProjects: argv.selectProjects,
    });
    if (namesMissingWarning) {
      outputStream.write(namesMissingWarning);
    }
    outputStream.write(
      getSelectProjectsMessage(configsOfProjectsToRun, {
        ignoreProjects: argv.ignoreProjects,
        selectProjects: argv.selectProjects,
      }),
    );
  }

  const results = await _run(
    globalConfig,
    configsOfProjectsToRun,
    hasDeprecationWarnings,
    outputStream,
  );

  if (!results) {
    throw new Error(
      'AggregatedResult must be present after test run is complete',
    );
  }

  const {openHandles} = results;

  if (openHandles && openHandles.length) {
    const formatted = formatHandleErrors(openHandles, configs[0]);

    const openHandlesString = pluralize('open handle', formatted.length, 's');

    const message =
      chalk.red(
        `\nJest has detected the following ${openHandlesString} potentially keeping Jest from exiting:\n\n`,
      ) + formatted.join('\n\n');

    console.error(message);
  }

  performance.mark('jest/runCLI:end');
  return {globalConfig, results};
}
