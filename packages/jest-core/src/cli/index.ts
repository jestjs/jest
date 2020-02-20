/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import type {AggregatedResult} from '@jest/test-result';
import {CustomConsole} from '@jest/console';
import {createDirectory, preRunMessage} from 'jest-util';
import {readConfigs} from 'jest-config';
import Runtime = require('jest-runtime');
import type {ChangedFilesPromise} from 'jest-changed-files';
import HasteMap = require('jest-haste-map');
import chalk = require('chalk');
import rimraf = require('rimraf');
import exit = require('exit');
import type {Filter} from '../types';
import createContext from '../lib/create_context';
import getChangedFilesPromise from '../getChangedFilesPromise';
import {formatHandleErrors} from '../collectHandles';
import handleDeprecationWarnings from '../lib/handle_deprecation_warnings';
import runJest from '../runJest';
import TestWatcher from '../TestWatcher';
import watch from '../watch';
import pluralize from '../pluralize';
import logDebugMessages from '../lib/log_debug_messages';
import getConfigsOfProjectsToRun from '../getConfigsOfProjectsToRun';
import getProjectNamesMissingWarning from '../getProjectNamesMissingWarning';
import getSelectProjectsMessage from '../getSelectProjectsMessage';

const {print: preRunMessagePrint} = preRunMessage;

type OnCompleteCallback = (results: AggregatedResult) => void;

export async function runCLI(
  argv: Config.Argv,
  projects: Array<Config.Path>,
): Promise<{
  results: AggregatedResult;
  globalConfig: Config.GlobalConfig;
}> {
  let results: AggregatedResult | undefined;

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
    configs.forEach(config => {
      rimraf.sync(config.cacheDirectory);
      process.stdout.write(`Cleared ${config.cacheDirectory}\n`);
    });

    exit(0);
  }

  let configsOfProjectsToRun = configs;
  if (argv.selectProjects) {
    const namesMissingWarning = getProjectNamesMissingWarning(configs);
    if (namesMissingWarning) {
      outputStream.write(namesMissingWarning);
    }
    configsOfProjectsToRun = getConfigsOfProjectsToRun(
      argv.selectProjects,
      configs,
    );
    outputStream.write(getSelectProjectsMessage(configsOfProjectsToRun));
  }

  await _run10000(
    globalConfig,
    configsOfProjectsToRun,
    hasDeprecationWarnings,
    outputStream,
    r => (results = r),
  );

  if (argv.watch || argv.watchAll) {
    // If in watch mode, return the promise that will never resolve.
    // If the watch mode is interrupted, watch should handle the process
    // shutdown.
    return new Promise(() => {});
  }

  if (!results) {
    throw new Error(
      'AggregatedResult must be present after test run is complete',
    );
  }

  if (globalConfig.detectOpenHandles) {
    const formatted = formatHandleErrors(results.openHandles, configs[0]);

    if (formatted.length > 0) {
      const uncollectedHandles = formatted
        .filter(({wasCollected}) => !wasCollected)
        .map(({stack}) => stack);
      const collectedHandles = formatted
        .filter(({wasCollected}) => wasCollected)
        .map(({stack}) => stack);

      const openHandlesString = pluralize('open handle', formatted.length, 's');

      const alreadyCollectedString =
        collectedHandles.length === 0
          ? ''
          : collectedHandles.length === 1
          ? '1 was'
          : `${collectedHandles.length} were`;

      let heading = chalk.red(
        `Jest has detected the following ${openHandlesString} potentially preventing Jest from exiting:\n`,
      );

      if (alreadyCollectedString) {
        heading += `${chalk.yellow(
          `Of them ${alreadyCollectedString} collected within 100ms of the tests completing.\nThese are sometimes useful to look at as they might have spawned other handles that remain open, but that we have lost the origin of.`,
        )}\n`;
      }

      const uncollectedHandlesWarning =
        uncollectedHandles.length === 0
          ? `\n${chalk.red(
              'There were no uncollected handles - this is unexpected if your tests do not exit cleanly!',
            )}\n\n`
          : '\n';

      const handles = [...uncollectedHandles, ...collectedHandles]
        .map(line => line.trimRight())
        .join('\n\n');

      const message = `\n${heading}${uncollectedHandlesWarning}${handles}`;

      console.error(message);
    } else {
      console.error(chalk.red('\nJest was unable to detect any open handles'));
    }
  }

  return {globalConfig, results};
}

const buildContextsAndHasteMaps = async (
  configs: Array<Config.ProjectConfig>,
  globalConfig: Config.GlobalConfig,
  outputStream: NodeJS.WriteStream,
) => {
  const hasteMapInstances = Array(configs.length);
  const contexts = await Promise.all(
    configs.map(async (config, index) => {
      createDirectory(config.cacheDirectory);
      const hasteMapInstance = Runtime.createHasteMap(config, {
        console: new CustomConsole(outputStream, outputStream),
        maxWorkers: Math.max(
          1,
          Math.floor(globalConfig.maxWorkers / configs.length),
        ),
        resetCache: !config.cache,
        watch: globalConfig.watch || globalConfig.watchAll,
        watchman: globalConfig.watchman,
      });
      hasteMapInstances[index] = hasteMapInstance;
      return createContext(config, await hasteMapInstance.build());
    }),
  );

  return {contexts, hasteMapInstances};
};

const _run10000 = async (
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
  hasDeprecationWarnings: boolean,
  outputStream: NodeJS.WriteStream,
  onComplete: OnCompleteCallback,
) => {
  // Queries to hg/git can take a while, so we need to start the process
  // as soon as possible, so by the time we need the result it's already there.
  const changedFilesPromise = getChangedFilesPromise(globalConfig, configs);

  // Filter may need to do an HTTP call or something similar to setup.
  // We will wait on an async response from this before using the filter.
  let filter: Filter | undefined;
  if (globalConfig.filter && !globalConfig.skipFilter) {
    const rawFilter = require(globalConfig.filter);
    let filterSetupPromise: Promise<Error | undefined> | undefined;
    if (rawFilter.setup) {
      // Wrap filter setup Promise to avoid "uncaught Promise" error.
      // If an error is returned, we surface it in the return value.
      filterSetupPromise = (async () => {
        try {
          await rawFilter.setup();
        } catch (err) {
          return err;
        }
        return undefined;
      })();
    }
    filter = async (testPaths: Array<string>) => {
      if (filterSetupPromise) {
        // Expect an undefined return value unless there was an error.
        const err = await filterSetupPromise;
        if (err) {
          throw err;
        }
      }
      return rawFilter(testPaths);
    };
  }

  const {contexts, hasteMapInstances} = await buildContextsAndHasteMaps(
    configs,
    globalConfig,
    outputStream,
  );

  globalConfig.watch || globalConfig.watchAll
    ? await runWatch(
        contexts,
        configs,
        hasDeprecationWarnings,
        globalConfig,
        outputStream,
        hasteMapInstances,
        filter,
      )
    : await runWithoutWatch(
        globalConfig,
        contexts,
        outputStream,
        onComplete,
        changedFilesPromise,
        filter,
      );
};

const runWatch = async (
  contexts: Array<Runtime.Context>,
  _configs: Array<Config.ProjectConfig>,
  hasDeprecationWarnings: boolean,
  globalConfig: Config.GlobalConfig,
  outputStream: NodeJS.WriteStream,
  hasteMapInstances: Array<HasteMap>,
  filter?: Filter,
) => {
  if (hasDeprecationWarnings) {
    try {
      await handleDeprecationWarnings(outputStream, process.stdin);
      return watch(
        globalConfig,
        contexts,
        outputStream,
        hasteMapInstances,
        undefined,
        undefined,
        filter,
      );
    } catch {
      exit(0);
    }
  }

  return watch(
    globalConfig,
    contexts,
    outputStream,
    hasteMapInstances,
    undefined,
    undefined,
    filter,
  );
};

const runWithoutWatch = async (
  globalConfig: Config.GlobalConfig,
  contexts: Array<Runtime.Context>,
  outputStream: NodeJS.WriteStream,
  onComplete: OnCompleteCallback,
  changedFilesPromise?: ChangedFilesPromise,
  filter?: Filter,
) => {
  const startRun = async (): Promise<void | null> => {
    if (!globalConfig.listTests) {
      preRunMessagePrint(outputStream);
    }
    return runJest({
      changedFilesPromise,
      contexts,
      failedTestsCache: undefined,
      filter,
      globalConfig,
      onComplete,
      outputStream,
      startRun,
      testWatcher: new TestWatcher({isWatchMode: false}),
    });
  };
  return startRun();
};
