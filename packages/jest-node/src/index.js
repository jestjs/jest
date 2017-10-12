/*
 * IMPORTANT:
 *
 * methods
 * 'ensureNoDuplicateConfigs', 'getConfigs', 'buildContextsAndHasteMaps',
 * '_run', 'runWatch' and 'runWithoutWatch' are copied from
 * 'jest-cli/src/cli/index.js' file - they should be merged
 *
 * method 'printDebugInfoAndExitIfNeeded' is also copied from jest-cli but
 * instead of calling process.exit() it throw error -> reject promise.
 */

/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';
import type {Argv} from 'types/Argv';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';

import {Console, createDirectory} from 'jest-util';
import {readConfig} from 'jest-config';
import createContext from 'jest-cli/build/lib/create_context';
import getChangedFilesPromise from 'jest-cli/build/get_changed_files_promise';
import handleDeprecationWarnings from 'jest-cli/build/lib/handle_deprecation_warnings';
import logDebugMessages from 'jest-cli/build/lib/log_debug_messages';
import {print as preRunMessagePrint} from 'jest-cli/build/pre_run_message';
import runJest from 'jest-cli/build/run_jest';
import Runtime from 'jest-runtime';
import TestWatcher from 'jest-cli/build/test_watcher';
import watch from 'jest-cli/build/watch';
import {WritableStream} from 'memory-streams';
import EventEmitter from 'events';

const printDebugInfoAndExitIfNeeded = (
  argv,
  configs,
  globalConfig,
  outputStream,
) => {
  if (argv.debug || argv.showConfig) {
    logDebugMessages(globalConfig, configs, outputStream);
  }
  if (argv.showConfig) {
    const json = {
      configs,
      globalConfig,
    };
    throw new Error(JSON.stringify(json));
  }
};

const ensureNoDuplicateConfigs = (parsedConfigs, projects) => {
  const configPathSet = new Set();

  for (const {configPath} of parsedConfigs) {
    if (configPathSet.has(configPath)) {
      let message =
        'One or more specified projects share the same config file\n';

      parsedConfigs.forEach(({configPath}, index) => {
        message =
          message +
          '\nProject: "' +
          projects[index] +
          '"\nConfig: "' +
          String(configPath) +
          '"';
      });
      throw new Error(message);
    }
    configPathSet.add(configPath);
  }
};

// Possible scenarios:
//  1. jest --config config.json
//  2. jest --projects p1 p2
//  3. jest --projects p1 p2 --config config.json
//  4. jest --projects p1
//  5. jest
//
// If no projects are specified, process.cwd() will be used as the default
// (and only) project.
const getConfigs = (
  projectsFromCLIArgs: Array<Path>,
  argv: Argv,
  outputStream,
): {
  globalConfig: GlobalConfig,
  configs: Array<ProjectConfig>,
  hasDeprecationWarnings: boolean,
} => {
  let globalConfig;
  let hasDeprecationWarnings;
  let configs: Array<ProjectConfig> = [];
  let projects = projectsFromCLIArgs;

  if (projectsFromCLIArgs.length === 1) {
    const parsedConfig = readConfig(argv, projects[0]);

    if (parsedConfig.globalConfig.projects) {
      // If this was a single project, and its config has `projects`
      // settings, use that value instead.
      projects = parsedConfig.globalConfig.projects;
    }

    hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings;
    globalConfig = parsedConfig.globalConfig;
    configs = [parsedConfig.projectConfig];
    if (globalConfig.projects && globalConfig.projects.length) {
      // Even though we had one project in CLI args, there might be more
      // projects defined in the config.
      projects = globalConfig.projects;
    }
  }

  if (projects.length > 1) {
    const parsedConfigs = projects.map(root => readConfig(argv, root, true));
    ensureNoDuplicateConfigs(parsedConfigs, projects);
    configs = parsedConfigs.map(({projectConfig}) => projectConfig);
    if (!hasDeprecationWarnings) {
      hasDeprecationWarnings = parsedConfigs.some(
        ({hasDeprecationWarnings}) => !!hasDeprecationWarnings,
      );
    }
    // If no config was passed initially, use the one from the first project
    if (!globalConfig) {
      globalConfig = parsedConfigs[0].globalConfig;
    }
  }

  if (!globalConfig || !configs.length) {
    throw new Error('jest: No configuration found for any project.');
  }

  printDebugInfoAndExitIfNeeded(argv, globalConfig, configs, outputStream);

  return {
    configs,
    globalConfig,
    hasDeprecationWarnings: !!hasDeprecationWarnings,
  };
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
        changedFilesPromise,
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
  changedFilesPromise,
) => {
  if (hasDeprecationWarnings) {
    try {
      await handleDeprecationWarnings(outputStream, process.stdin);
      return watch(globalConfig, contexts, outputStream, hasteMapInstances);
    } catch (e) {
      process.exit(0);
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
    return await runJest({
      changedFilesPromise,
      contexts,
      globalConfig,
      onComplete,
      outputStream,
      startRun,
      testWatcher: new TestWatcher({isWatchMode: false}),
    });
  };
  return await startRun();
};

/*
 * Helper method for calling jest from node process. Parameters are the same as
 * runCLI method defined in 'jest-cli/build/cli/index.js'
 */
type jestNodeResult =
  | {results: AggregatedResult, globalConfig: GlobalConfig}
  | EventEmitter;

const jestNode = async (
  argv: Argv,
  projects: Array<Path>,
): Promise<jestNodeResult> => {
  let results;
  const outputStream = new WritableStream();

  try {
    const {globalConfig, configs, hasDeprecationWarnings} = getConfigs(
      projects,
      argv,
      outputStream,
    );

    let onComplete = (r: AggregatedResult) => {
      return (results = r);
    };

    let emitter: ?EventEmitter = undefined;
    if (argv.watch || argv.watchAll) {
      emitter = new EventEmitter();
      onComplete = (r: AggregatedResult) => {
        results = r;
        if (emitter != null) {
          emitter.emit('complete', {globalConfig, results});
        }
        return results;
      };
    }

    await _run(
      globalConfig,
      configs,
      hasDeprecationWarnings,
      outputStream,
      onComplete,
    );

    if (emitter != null) {
      return Promise.resolve(emitter);
    }

    if (!results) {
      throw new Error(
        'AggregatedResult must be present after test run is complete',
      );
    }

    return Promise.resolve({globalConfig, results});
  } catch (error) {
    return Promise.reject(error);
  }
};

export default jestNode;
