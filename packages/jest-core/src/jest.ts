/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {performance} from 'perf_hooks';
import type {WriteStream} from 'tty';
import exit = require('exit');
import {CustomConsole} from '@jest/console';
import type {AggregatedResult, TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {ChangedFilesPromise} from 'jest-changed-files';
import {readConfigs} from 'jest-config';
import type {IHasteMap} from 'jest-haste-map';
import Runtime from 'jest-runtime';
import {createDirectory, preRunMessage} from 'jest-util';
import {TestWatcher} from 'jest-watcher';
import getChangedFilesPromise from './getChangedFilesPromise';
import createContext from './lib/createContext';
import handleDeprecationWarnings from './lib/handleDeprecationWarnings';
import runJest from './runJest';
import type {Filter, JestRunResult, OnCompleteCallback} from './types';
import watch from './watch';

const {print: preRunMessagePrint} = preRunMessage;

/**
 * `Jest` class as a convenient API for programmatic use.
 */
export class Jest {
  private constructor(
    public globalConfig: Readonly<Config.GlobalConfig>,
    public projectConfigs: Array<Readonly<Config.ProjectConfig>>,
  ) {}

  public static async createJest(
    args: Partial<Config.Argv> = {},
    projectPaths = ['.'],
  ): Promise<Jest> {
    const {globalConfig, configs} = await readConfigs(
      {$0: 'programmatic', _: [], ...args},
      projectPaths,
    );
    return new Jest(globalConfig, configs);
  }

  /**
   * Runs Jest either in watch mode or as a one-off. This is a lower-level API than `runCLI` and is intended for internal use by `runCLI` or externally.
   * Note that `process.exit` might be called when using `globalConfig.watch`, `globalConfig.watchAll` or `globalConfig.bail` are set.
   *
   * @param globalConfig The global configuration to use for this run.
   * @param projectConfigs The project configurations to run.
   * @returns A Promise that resolves to the result, or never resolves when `globalConfig.watch` or `globalConfig.watchAll` are set.
   * @example
   * import {createJest} from 'jest';
   *
   * const jest = await createJest();
   * const {results} = await jest.run();
   * console.log(results);
   */
  async run(): Promise<JestRunResult> {
    const outputStream = this.globalConfig.useStderr
      ? process.stderr
      : process.stdout;
    const results = await _run(
      this.globalConfig,
      this.projectConfigs,
      false,
      outputStream,
    );
    return {results};
  }
}

export const createJest = Jest.createJest;

const buildContextsAndHasteMaps = async (
  configs: Array<Config.ProjectConfig>,
  globalConfig: Config.GlobalConfig,
  outputStream: WriteStream,
) => {
  const hasteMapInstances = Array(configs.length);
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

export const _run = async (
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
  hasDeprecationWarnings: boolean,
  outputStream: WriteStream,
): Promise<AggregatedResult> => {
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

  performance.mark('jest/buildContextsAndHasteMaps:start');
  const {contexts, hasteMapInstances} = await buildContextsAndHasteMaps(
    configs,
    globalConfig,
    outputStream,
  );
  performance.mark('jest/buildContextsAndHasteMaps:end');

  if (globalConfig.watch || globalConfig.watchAll) {
    await runWatch(
      contexts,
      configs,
      hasDeprecationWarnings,
      globalConfig,
      outputStream,
      hasteMapInstances,
      filter,
    );
    // If in watch mode, return the promise that will never resolve.
    // If the watch mode is interrupted, watch should handle the process
    // shutdown.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Promise(() => {});
  } else {
    let result: AggregatedResult;
    await runWithoutWatch(
      globalConfig,
      contexts,
      outputStream,
      r => {
        result = r;
      },
      changedFilesPromise,
      filter,
    );
    return result!;
  }
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
