/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';
import type {Argv} from 'types/Argv';
import type {GlobalConfig, Path} from 'types/Config';

import {Console, createDirectory, preRunMessage} from 'jest-util';
import {readConfigs} from 'jest-config';
import chalk from 'chalk';
import createContext from '../lib/create_context';
import exit from 'exit';
import getChangedFilesPromise from '../getChangedFilesPromise';
import {formatHandleErrors} from '../collectHandles';
import handleDeprecationWarnings from '../lib/handle_deprecation_warnings';
import runJest from '../runJest';
import Runtime from 'jest-runtime';
import TestWatcher from '../TestWatcher';
import watch from '../watch';
import pluralize from '../pluralize';
import rimraf from 'rimraf';
import logDebugMessages from '../lib/log_debug_messages';

const {print: preRunMessagePrint} = preRunMessage;

export const runCLI = async (
  argv: Argv,
  projects: Array<Path>,
): Promise<{results: AggregatedResult, globalConfig: GlobalConfig}> => {
  const realFs = require('fs');
  const fs = require('graceful-fs');
  fs.gracefulify(realFs);

  let results;

  // If we output a JSON object, we can't write anything to stdout, since
  // it'll break the JSON structure and it won't be valid.
  const outputStream =
    argv.json || argv.useStderr ? process.stderr : process.stdout;

  const {globalConfig, configs, hasDeprecationWarnings} = readConfigs(
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

  await _run(
    globalConfig,
    configs,
    hasDeprecationWarnings,
    outputStream,
    (r: AggregatedResult) => (results = r),
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

  return {globalConfig, results};
};

const buildContextsAndHasteMaps = async (
  configs,
  globalConfig,
  outputStream,
) => {
  const hasteMapInstances = Array(configs.length);
  const contexts = await Promise.all(
    configs.map(async (config, index) => {
      createDirectory(config.cacheDirectory);
      const hasteMapInstance = Runtime.createHasteMap(config, {
        console: new Console(outputStream, outputStream),
        maxWorkers: globalConfig.maxWorkers,
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

const _run = async (
  globalConfig,
  configs,
  hasDeprecationWarnings,
  outputStream,
  onComplete,
) => {
  // Queries to hg/git can take a while, so we need to start the process
  // as soon as possible, so by the time we need the result it's already there.
  const changedFilesPromise = getChangedFilesPromise(globalConfig, configs);

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
      )
    : await runWithoutWatch(
        globalConfig,
        contexts,
        outputStream,
        onComplete,
        changedFilesPromise,
      );
};

const runWatch = async (
  contexts,
  configs,
  hasDeprecationWarnings,
  globalConfig,
  outputStream,
  hasteMapInstances,
) => {
  if (hasDeprecationWarnings) {
    try {
      await handleDeprecationWarnings(outputStream, process.stdin);
      return watch(globalConfig, contexts, outputStream, hasteMapInstances);
    } catch (e) {
      exit(0);
    }
  }

  return watch(globalConfig, contexts, outputStream, hasteMapInstances);
};

const runWithoutWatch = async (
  globalConfig,
  contexts,
  outputStream,
  onComplete,
  changedFilesPromise,
) => {
  const startRun = async () => {
    if (!globalConfig.listTests) {
      preRunMessagePrint(outputStream);
    }
    return runJest({
      changedFilesPromise,
      contexts,
      failedTestsCache: null,
      globalConfig,
      onComplete,
      outputStream,
      startRun,
      testWatcher: new TestWatcher({isWatchMode: false}),
    });
  };
  return startRun();
};
