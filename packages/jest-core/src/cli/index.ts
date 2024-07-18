/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {performance} from 'perf_hooks';
import type {WriteStream} from 'tty';
import exit = require('exit');
import * as fs from 'graceful-fs';
import * as pico from 'picocolors';
import {CustomConsole} from '@jest/console';
import type {AggregatedResult, TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {ChangedFilesPromise} from 'jest-changed-files';
import {readConfigs} from 'jest-config';
import type {IHasteMap} from 'jest-haste-map';
import Runtime from 'jest-runtime';
import {createDirectory, pluralize, preRunMessage} from 'jest-util';
import {TestWatcher} from 'jest-watcher';
import {formatHandleErrors} from '../collectHandles';
import getChangedFilesPromise from '../getChangedFilesPromise';
import getConfigsOfProjectsToRun from '../getConfigsOfProjectsToRun';
import getProjectNamesMissingWarning from '../getProjectNamesMissingWarning';
import getSelectProjectsMessage from '../getSelectProjectsMessage';
import createContext from '../lib/createContext';
import handleDeprecationWarnings from '../lib/handleDeprecationWarnings';
import logDebugMessages from '../lib/logDebugMessages';
import runJest from '../runJest';
import type {Filter} from '../types';
import watch from '../watch';

const {print: preRunMessagePrint} = preRunMessage;

type OnCompleteCallback = (results: AggregatedResult) => void | undefined;

export async function runCLI(
  argv: Config.Argv,
  projects: Array<string>,
): Promise<{
  results: AggregatedResult;
  globalConfig: Config.GlobalConfig;
}> {
  performance.mark('jest/runCLI:start');
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
    // stick in a Set to dedupe the deletions
    const uniqueConfigDirectories = new Set(
      configs.map(config => config.cacheDirectory),
    );
    for (const cacheDirectory of uniqueConfigDirectories) {
      fs.rmSync(cacheDirectory, {force: true, recursive: true});
      process.stdout.write(`Cleared ${cacheDirectory}\n`);
    }

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

  await _run10000(
    globalConfig,
    configsOfProjectsToRun,
    hasDeprecationWarnings,
    outputStream,
    r => {
      results = r;
    },
  );

  if (argv.watch || argv.watchAll) {
    // If in watch mode, return the promise that will never resolve.
    // If the watch mode is interrupted, watch should handle the process
    // shutdown.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Promise(() => {});
  }

  if (!results) {
    throw new Error(
      'AggregatedResult must be present after test run is complete',
    );
  }

  const {openHandles} = results;

  if (openHandles && openHandles.length > 0) {
    const formatted = formatHandleErrors(openHandles, configs[0]);

    const openHandlesString = pluralize('open handle', formatted.length, 's');

    const message =
      pico.red(
        `\nJest has detected the following ${openHandlesString} potentially keeping Jest from exiting:\n\n`,
      ) + formatted.join('\n\n');

    console.error(message);
  }

  performance.mark('jest/runCLI:end');
  return {globalConfig, results};
}

const buildContextsAndHasteMaps = async (
  configs: Array<Config.ProjectConfig>,
  globalConfig: Config.GlobalConfig,
  outputStream: WriteStream,
) => {
  const hasteMapInstances = Array.from<IHasteMap>({
    length: configs.length,
  });
  const contexts = await Promise.all(
    configs.map(async (config, index) => {
      createDirectory(config.cacheDirectory);
      const hasteMapInstance = await Runtime.createHasteMap(config, {
        console: new CustomConsole(outputStream, outputStream),
        maxWorkers: Math.max(
          1,
          Math.floor(globalConfig.maxWorkers / configs.length),
        ),
        resetCache: !config.cache,
        watch: globalConfig.watch || globalConfig.watchAll,
        watchman: globalConfig.watchman,
        workerThreads: globalConfig.workerThreads,
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
  outputStream: WriteStream,
  onComplete: OnCompleteCallback,
) => {
  // Queries to hg/git can take a while, so we need to start the process
  // as soon as possible, so by the time we need the result it's already there.
  const changedFilesPromise = getChangedFilesPromise(globalConfig, configs);
  if (changedFilesPromise) {
    performance.mark('jest/getChangedFiles:start');
    changedFilesPromise.finally(() => {
      performance.mark('jest/getChangedFiles:end');
    });
  }

  // Filter may need to do an HTTP call or something similar to setup.
  // We will wait on an async response from this before using the filter.
  let filter: Filter | undefined;
  if (globalConfig.filter && !globalConfig.skipFilter) {
    const rawFilter = require(globalConfig.filter);
    let filterSetupPromise: Promise<unknown | undefined> | undefined;
    if (rawFilter.setup) {
      // Wrap filter setup Promise to avoid "uncaught Promise" error.
      // If an error is returned, we surface it in the return value.
      filterSetupPromise = (async () => {
        try {
          await rawFilter.setup();
        } catch (error) {
          return error;
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

  performance.mark('jest/buildContextsAndHasteMaps:start');
  const {contexts, hasteMapInstances} = await buildContextsAndHasteMaps(
    configs,
    globalConfig,
    outputStream,
  );
  performance.mark('jest/buildContextsAndHasteMaps:end');

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
  contexts: Array<TestContext>,
  _configs: Array<Config.ProjectConfig>,
  hasDeprecationWarnings: boolean,
  globalConfig: Config.GlobalConfig,
  outputStream: WriteStream,
  hasteMapInstances: Array<IHasteMap>,
  filter?: Filter,
) => {
  if (hasDeprecationWarnings) {
    try {
      await handleDeprecationWarnings(outputStream, process.stdin);
      return await watch(
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
  contexts: Array<TestContext>,
  outputStream: WriteStream,
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
