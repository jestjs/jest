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

import {Console, clearLine, createDirectory} from 'jest-util';
import {validateCLIOptions} from 'jest-validate';
import {readConfig, deprecationEntries} from 'jest-config';
import * as args from './args';
import chalk from 'chalk';
import createContext from '../lib/create_context';
import exit from 'exit';
import getChangedFilesPromise from '../get_changed_files_promise';
import {formatHandleErrors} from '../get_node_handles';
import fs from 'fs';
import handleDeprecationWarnings from '../lib/handle_deprecation_warnings';
import logDebugMessages from '../lib/log_debug_messages';
import {print as preRunMessagePrint} from '../pre_run_message';
import runJest from '../run_jest';
import Runtime from 'jest-runtime';
import TestWatcher from '../test_watcher';
import watch from '../watch';
import pluralize from '../pluralize';
import yargs from 'yargs';
import rimraf from 'rimraf';
import {sync as realpath} from 'realpath-native';
import init from '../lib/init';

export async function run(maybeArgv?: Argv, project?: Path) {
  try {
    const argv: Argv = buildArgv(maybeArgv, project);

    if (argv.init) {
      await init();
      return;
    }

    const projects = getProjectListFromCLIArgs(argv, project);

    const {results, globalConfig} = await runCLI(argv, projects);
    readResultsAndExit(results, globalConfig);
  } catch (error) {
    clearLine(process.stderr);
    clearLine(process.stdout);
    console.error(chalk.red(error.stack));
    exit(1);
    throw error;
  }
}

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

  const {globalConfig, configs, hasDeprecationWarnings} = getConfigs(
    projects,
    argv,
    outputStream,
  );

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
    const openHandlesString = pluralize('open handle', openHandles.length, 's');

    const message =
      chalk.red(
        `\nJest has detected the following ${openHandlesString} potentially keeping Jest from exiting:\n\n`,
      ) + formatHandleErrors(openHandles, configs[0]).join('\n\n');

    console.error(message);
  }

  return Promise.resolve({globalConfig, results});
};

const readResultsAndExit = (
  result: ?AggregatedResult,
  globalConfig: GlobalConfig,
) => {
  const code = !result || result.success ? 0 : globalConfig.testFailureExitCode;

  process.on('exit', () => (process.exitCode = code));

  if (globalConfig.forceExit) {
    if (!globalConfig.detectOpenHandles) {
      console.error(
        chalk.red.bold('Force exiting Jest\n\n') +
          chalk.red(
            'Have you considered using `--detectOpenHandles` to detect ' +
              'async operations that kept running after all tests finished?',
          ),
      );
    }

    exit(code);
  } else if (!globalConfig.detectOpenHandles) {
    setTimeout(() => {
      console.error(
        chalk.red.bold(
          'Jest did not exit one second after the test run has completed.\n\n',
        ) +
          chalk.red(
            'This usually means that there are asynchronous operations that ' +
              "weren't stopped in your tests. Consider running Jest with " +
              '`--detectOpenHandles` to troubleshoot this issue.',
          ),
      );
      // $FlowFixMe: `unref` exists in Node
    }, 1000).unref();
  }
};

const buildArgv = (maybeArgv: ?Argv, project: ?Path) => {
  const argv: Argv = yargs(maybeArgv || process.argv.slice(2))
    .usage(args.usage)
    .alias('help', 'h')
    .options(args.options)
    .epilogue(args.docs)
    .check(args.check).argv;

  validateCLIOptions(
    argv,
    Object.assign({}, args.options, {deprecationEntries}),
  );

  return argv;
};

const getProjectListFromCLIArgs = (argv, project: ?Path) => {
  const projects = argv.projects ? argv.projects : [];

  if (project) {
    projects.push(project);
  }

  if (!projects.length && process.platform === 'win32') {
    try {
      projects.push(realpath(process.cwd()));
    } catch (err) {
      // do nothing, just catch error
      // process.binding('fs').realpath can throw, e.g. on mapped drives
    }
  }

  if (!projects.length) {
    projects.push(process.cwd());
  }

  return projects;
};

const printDebugInfoAndExitIfNeeded = (
  argv,
  globalConfig,
  configs,
  outputStream,
) => {
  if (argv.debug) {
    logDebugMessages(globalConfig, configs, outputStream);
    return;
  }

  if (argv.showConfig) {
    logDebugMessages(globalConfig, configs, process.stdout);
    exit(0);
  }
};

const ensureNoDuplicateConfigs = (parsedConfigs, projects, rootConfigPath) => {
  const configPathMap = new Map();

  for (const config of parsedConfigs) {
    const {configPath} = config;
    if (configPathMap.has(configPath)) {
      const message = `Whoops! Two projects resolved to the same config path: ${chalk.bold(
        String(configPath),
      )}:

  Project 1: ${chalk.bold(projects[parsedConfigs.findIndex(x => x === config)])}
  Project 2: ${chalk.bold(
    projects[parsedConfigs.findIndex(x => x === configPathMap.get(configPath))],
  )}

This usually means that your ${chalk.bold(
        '"projects"',
      )} config includes a directory that doesn't have any configuration recognizable by Jest. Please fix it.
`;

      throw new Error(message);
    }
    if (configPath !== null) {
      configPathMap.set(configPath, config);
    }
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
  let configPath: ?Path;

  if (projectsFromCLIArgs.length === 1) {
    const parsedConfig = readConfig(argv, projects[0]);
    configPath = parsedConfig.configPath;

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
    const parsedConfigs = projects
      .filter(root => {
        // Ignore globbed files that cannot be `require`d.
        if (
          fs.existsSync(root) &&
          !fs.lstatSync(root).isDirectory() &&
          !root.endsWith('.js') &&
          !root.endsWith('.json')
        ) {
          return false;
        }

        return true;
      })
      .map(root => readConfig(argv, root, true, configPath));

    ensureNoDuplicateConfigs(parsedConfigs, projects, configPath);
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
    return await runJest({
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
  return await startRun();
};
