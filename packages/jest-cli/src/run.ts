/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import exit = require('exit');
import * as pico from 'picocolors';
import yargs = require('yargs');
import {getVersion, runCLI} from '@jest/core';
import type {AggregatedResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import {deprecationEntries} from 'jest-config';
import {clearLine, tryRealpath} from 'jest-util';
import {validateCLIOptions} from 'jest-validate';
import * as args from './args';

export async function run(
  maybeArgv?: Array<string>,
  project?: string,
): Promise<void> {
  try {
    const argv = await buildArgv(maybeArgv);
    const projects = getProjectListFromCLIArgs(argv, project);

    const {results, globalConfig} = await runCLI(argv, projects);
    readResultsAndExit(results, globalConfig);
  } catch (error: any) {
    clearLine(process.stderr);
    clearLine(process.stdout);
    if (error?.stack) {
      console.error(pico.red(error.stack));
    } else {
      console.error(pico.red(error));
    }

    exit(1);
    throw error;
  }
}

export async function buildArgv(
  maybeArgv?: Array<string>,
): Promise<Config.Argv> {
  const version =
    getVersion() +
    (__dirname.includes(`packages${path.sep}jest-cli`) ? '-dev' : '');

  const rawArgv: Array<string> = maybeArgv || process.argv.slice(2);
  const argv: Config.Argv = await yargs(rawArgv)
    .usage(args.usage)
    .version(version)
    .alias('help', 'h')
    .options(args.options)
    .epilogue(args.docs)
    .check(args.check).argv;

  validateCLIOptions(
    argv,
    {...args.options, deprecationEntries},
    // strip leading dashes
    Array.isArray(rawArgv)
      ? rawArgv.map(rawArgv => rawArgv.replace(/^--?/, ''))
      : Object.keys(rawArgv),
  );

  // strip dashed args
  return Object.keys(argv).reduce<Config.Argv>(
    (result, key) => {
      if (!key.includes('-')) {
        result[key] = argv[key];
      }
      return result;
    },
    {$0: argv.$0, _: argv._},
  );
}

const getProjectListFromCLIArgs = (argv: Config.Argv, project?: string) => {
  const projects = argv.projects ?? [];

  if (project) {
    projects.push(project);
  }

  if (projects.length === 0 && process.platform === 'win32') {
    try {
      projects.push(tryRealpath(process.cwd()));
    } catch {
      // do nothing, just catch error
      // process.binding('fs').realpath can throw, e.g. on mapped drives
    }
  }

  if (projects.length === 0) {
    projects.push(process.cwd());
  }

  return projects;
};

const readResultsAndExit = (
  result: AggregatedResult | null,
  globalConfig: Config.GlobalConfig,
) => {
  const code = !result || result.success ? 0 : globalConfig.testFailureExitCode;

  // Only exit if needed
  process.on('exit', () => {
    if (typeof code === 'number' && code !== 0) {
      process.exitCode = code;
    }
  });

  if (globalConfig.forceExit) {
    if (!globalConfig.detectOpenHandles) {
      console.warn(
        `${pico.bold(
          'Force exiting Jest: ',
        )}Have you considered using \`--detectOpenHandles\` to detect ` +
          'async operations that kept running after all tests finished?',
      );
    }

    exit(code);
  } else if (
    !globalConfig.detectOpenHandles &&
    globalConfig.openHandlesTimeout !== 0
  ) {
    const timeout = globalConfig.openHandlesTimeout;
    setTimeout(() => {
      console.warn(
        pico.yellow(
          pico.bold(
            `Jest did not exit ${
              timeout === 1000 ? 'one second' : `${timeout / 1000} seconds`
            } after the test run has completed.\n\n'`,
          ),
        ) +
          pico.yellow(
            'This usually means that there are asynchronous operations that ' +
              "weren't stopped in your tests. Consider running Jest with " +
              '`--detectOpenHandles` to troubleshoot this issue.',
          ),
      );
    }, timeout).unref();
  }
};
