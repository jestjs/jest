/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {tryRealpath} from 'jest-util';
import * as constants from './constants';
import normalize from './normalize';
import readConfigFileAndSetRootDir from './readConfigFileAndSetRootDir';
import resolveConfigPath from './resolveConfigPath';
import {isJSONString, replaceRootDirInPath} from './utils';

export {isJSONString} from './utils';
export {default as normalize} from './normalize';
export {default as deprecationEntries} from './Deprecated';
export {replaceRootDirInPath} from './utils';
export {default as defaults} from './Defaults';
export {default as descriptions} from './Descriptions';
export {constants};

type ReadConfig = {
  configPath: string | null | undefined;
  globalConfig: Config.GlobalConfig;
  hasDeprecationWarnings: boolean;
  projectConfig: Config.ProjectConfig;
};

export async function readConfig(
  argv: Config.Argv,
  packageRootOrConfig: string | Config.InitialOptions,
  // Whether it needs to look into `--config` arg passed to CLI.
  // It only used to read initial config. If the initial config contains
  // `project` property, we don't want to read `--config` value and rather
  // read individual configs for every project.
  skipArgvConfigOption?: boolean,
  parentConfigDirname?: string | null,
  projectIndex = Number.POSITIVE_INFINITY,
  skipMultipleConfigError = false,
): Promise<ReadConfig> {
  const {config: initialOptions, configPath} = await readInitialOptions(
    argv.config,
    {
      packageRootOrConfig,
      parentConfigDirname,
      readFromCwd: skipArgvConfigOption,
      skipMultipleConfigError,
    },
  );

  const packageRoot =
    typeof packageRootOrConfig === 'string'
      ? path.resolve(packageRootOrConfig)
      : undefined;
  const {options, hasDeprecationWarnings} = await normalize(
    initialOptions,
    argv,
    configPath,
    projectIndex,
    skipArgvConfigOption && !(packageRoot === parentConfigDirname),
  );

  const {globalConfig, projectConfig} = groupOptions(options);
  return {
    configPath,
    globalConfig,
    hasDeprecationWarnings,
    projectConfig,
  };
}

const groupOptions = (
  options: Config.ProjectConfig & Config.GlobalConfig,
): {
  globalConfig: Config.GlobalConfig;
  projectConfig: Config.ProjectConfig;
} => ({
  globalConfig: Object.freeze({
    bail: options.bail,
    changedFilesWithAncestor: options.changedFilesWithAncestor,
    changedSince: options.changedSince,
    ci: options.ci,
    collectCoverage: options.collectCoverage,
    collectCoverageFrom: options.collectCoverageFrom,
    coverageDirectory: options.coverageDirectory,
    coverageProvider: options.coverageProvider,
    coverageReporters: options.coverageReporters,
    coverageThreshold: options.coverageThreshold,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    errorOnDeprecated: options.errorOnDeprecated,
    expand: options.expand,
    filter: options.filter,
    findRelatedTests: options.findRelatedTests,
    forceExit: options.forceExit,
    globalSetup: options.globalSetup,
    globalTeardown: options.globalTeardown,
    json: options.json,
    lastCommit: options.lastCommit,
    listTests: options.listTests,
    logHeapUsage: options.logHeapUsage,
    maxConcurrency: options.maxConcurrency,
    maxWorkers: options.maxWorkers,
    noSCM: undefined,
    noStackTrace: options.noStackTrace,
    nonFlagArgs: options.nonFlagArgs,
    notify: options.notify,
    notifyMode: options.notifyMode,
    onlyChanged: options.onlyChanged,
    onlyFailures: options.onlyFailures,
    openHandlesTimeout: options.openHandlesTimeout,
    outputFile: options.outputFile,
    passWithNoTests: options.passWithNoTests,
    projects: options.projects,
    randomize: options.randomize,
    replname: options.replname,
    reporters: options.reporters,
    rootDir: options.rootDir,
    runInBand: options.runInBand,
    runTestsByPath: options.runTestsByPath,
    seed: options.seed,
    shard: options.shard,
    showSeed: options.showSeed,
    silent: options.silent,
    skipFilter: options.skipFilter,
    snapshotFormat: options.snapshotFormat,
    testFailureExitCode: options.testFailureExitCode,
    testNamePattern: options.testNamePattern,
    testPathPatterns: options.testPathPatterns,
    testResultsProcessor: options.testResultsProcessor,
    testSequencer: options.testSequencer,
    testTimeout: options.testTimeout,
    updateSnapshot: options.updateSnapshot,
    useStderr: options.useStderr,
    verbose: options.verbose,
    waitNextEventLoopTurnForUnhandledRejectionEvents:
      options.waitNextEventLoopTurnForUnhandledRejectionEvents,
    watch: options.watch,
    watchAll: options.watchAll,
    watchPlugins: options.watchPlugins,
    watchman: options.watchman,
    workerIdleMemoryLimit: options.workerIdleMemoryLimit,
    workerThreads: options.workerThreads,
  }),
  projectConfig: Object.freeze({
    automock: options.automock,
    cache: options.cache,
    cacheDirectory: options.cacheDirectory,
    clearMocks: options.clearMocks,
    collectCoverageFrom: options.collectCoverageFrom,
    coverageDirectory: options.coverageDirectory,
    coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
    coverageReporters: options.coverageReporters,
    cwd: options.cwd,
    dependencyExtractor: options.dependencyExtractor,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    displayName: options.displayName,
    errorOnDeprecated: options.errorOnDeprecated,
    extensionsToTreatAsEsm: options.extensionsToTreatAsEsm,
    fakeTimers: options.fakeTimers,
    filter: options.filter,
    forceCoverageMatch: options.forceCoverageMatch,
    globalSetup: options.globalSetup,
    globalTeardown: options.globalTeardown,
    globals: options.globals,
    haste: options.haste,
    id: options.id,
    injectGlobals: options.injectGlobals,
    moduleDirectories: options.moduleDirectories,
    moduleFileExtensions: options.moduleFileExtensions,
    moduleNameMapper: options.moduleNameMapper,
    modulePathIgnorePatterns: options.modulePathIgnorePatterns,
    modulePaths: options.modulePaths,
    openHandlesTimeout: options.openHandlesTimeout,
    prettierPath: options.prettierPath,
    reporters: options.reporters,
    resetMocks: options.resetMocks,
    resetModules: options.resetModules,
    resolver: options.resolver,
    restoreMocks: options.restoreMocks,
    rootDir: options.rootDir,
    roots: options.roots,
    runner: options.runner,
    runtime: options.runtime,
    sandboxInjectedGlobals: options.sandboxInjectedGlobals,
    setupFiles: options.setupFiles,
    setupFilesAfterEnv: options.setupFilesAfterEnv,
    skipFilter: options.skipFilter,
    skipNodeResolution: options.skipNodeResolution,
    slowTestThreshold: options.slowTestThreshold,
    snapshotFormat: options.snapshotFormat,
    snapshotResolver: options.snapshotResolver,
    snapshotSerializers: options.snapshotSerializers,
    testEnvironment: options.testEnvironment,
    testEnvironmentOptions: options.testEnvironmentOptions,
    testLocationInResults: options.testLocationInResults,
    testMatch: options.testMatch,
    testPathIgnorePatterns: options.testPathIgnorePatterns,
    testRegex: options.testRegex,
    testRunner: options.testRunner,
    testTimeout: options.testTimeout,
    transform: options.transform,
    transformIgnorePatterns: options.transformIgnorePatterns,
    unmockedModulePathPatterns: options.unmockedModulePathPatterns,
    waitNextEventLoopTurnForUnhandledRejectionEvents:
      options.waitNextEventLoopTurnForUnhandledRejectionEvents,
    watchPathIgnorePatterns: options.watchPathIgnorePatterns,
  }),
});

const ensureNoDuplicateConfigs = (
  parsedConfigs: Array<ReadConfig>,
  projects: Config.GlobalConfig['projects'],
) => {
  if (projects.length <= 1) {
    return;
  }

  const configPathMap = new Map();

  for (const config of parsedConfigs) {
    const {configPath} = config;

    if (configPathMap.has(configPath)) {
      const message = `Whoops! Two projects resolved to the same config path: ${chalk.bold(
        String(configPath),
      )}:

  Project 1: ${chalk.bold(projects[parsedConfigs.indexOf(config)])}
  Project 2: ${chalk.bold(
    projects[parsedConfigs.indexOf(configPathMap.get(configPath))],
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

export interface ReadJestConfigOptions {
  /**
   * The package root or deserialized config (default is cwd)
   */
  packageRootOrConfig?: string | Config.InitialOptions;
  /**
   * When the `packageRootOrConfig` contains config, this parameter should
   * contain the dirname of the parent config
   */
  parentConfigDirname?: null | string;
  /**
   * Indicates whether or not to read the specified config file from disk.
   * When true, jest will read try to read config from the current working directory.
   * (default is false)
   */
  readFromCwd?: boolean;
  /**
   * Indicates whether or not to ignore the error of jest finding multiple config files.
   * (default is false)
   */
  skipMultipleConfigError?: boolean;
}

/**
 * Reads the jest config, without validating them or filling it out with defaults.
 * @param config The path to the file or serialized config.
 * @param param1 Additional options
 * @returns The raw initial config (not validated)
 */
export async function readInitialOptions(
  config?: string,
  {
    packageRootOrConfig = process.cwd(),
    parentConfigDirname = null,
    readFromCwd = false,
    skipMultipleConfigError = false,
  }: ReadJestConfigOptions = {},
): Promise<{config: Config.InitialOptions; configPath: string | null}> {
  if (typeof packageRootOrConfig !== 'string') {
    if (parentConfigDirname) {
      const rawOptions = packageRootOrConfig;
      rawOptions.rootDir = rawOptions.rootDir
        ? replaceRootDirInPath(parentConfigDirname, rawOptions.rootDir)
        : parentConfigDirname;
      return {config: rawOptions, configPath: null};
    } else {
      throw new Error(
        'Jest: Cannot use configuration as an object without a file path.',
      );
    }
  }
  if (isJSONString(config)) {
    try {
      // A JSON string was passed to `--config` argument and we can parse it
      // and use as is.
      const initialOptions = JSON.parse(config);
      // NOTE: we might need to resolve this dir to an absolute path in the future
      initialOptions.rootDir = initialOptions.rootDir || packageRootOrConfig;
      return {config: initialOptions, configPath: null};
    } catch {
      throw new Error(
        'There was an error while parsing the `--config` argument as a JSON string.',
      );
    }
  }
  if (!readFromCwd && typeof config == 'string') {
    // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json`, `jest.config.js` or `jest.config.ts`
    const configPath = resolveConfigPath(
      config,
      process.cwd(),
      skipMultipleConfigError,
    );
    return {config: await readConfigFileAndSetRootDir(configPath), configPath};
  }
  // Otherwise just try to find config in the current rootDir.
  const configPath = resolveConfigPath(
    packageRootOrConfig,
    process.cwd(),
    skipMultipleConfigError,
  );
  return {config: await readConfigFileAndSetRootDir(configPath), configPath};
}

// Possible scenarios:
//  1. jest --config config.json
//  2. jest --projects p1 p2
//  3. jest --projects p1 p2 --config config.json
//  4. jest --projects p1
//  5. jest
//
// If no projects are specified, process.cwd() will be used as the default
// (and only) project.
export async function readConfigs(
  argv: Config.Argv,
  projectPaths: Array<string>,
): Promise<{
  globalConfig: Config.GlobalConfig;
  configs: Array<Config.ProjectConfig>;
  hasDeprecationWarnings: boolean;
}> {
  let globalConfig;
  let hasDeprecationWarnings;
  let configs: Array<Config.ProjectConfig> = [];
  let projects = projectPaths;
  let configPath: string | null | undefined;

  if (projectPaths.length === 1) {
    const parsedConfig = await readConfig(argv, projects[0]);
    configPath = parsedConfig.configPath;

    hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings;
    globalConfig = parsedConfig.globalConfig;
    configs = [parsedConfig.projectConfig];
    if (globalConfig.projects && globalConfig.projects.length > 0) {
      // Even though we had one project in CLI args, there might be more
      // projects defined in the config.
      // In other words, if this was a single project,
      // and its config has `projects` settings, use that value instead.
      projects = globalConfig.projects;
    }
  }

  if (projects.length > 0) {
    const cwd =
      process.platform === 'win32' ? tryRealpath(process.cwd()) : process.cwd();
    const projectIsCwd = projects[0] === cwd;

    const parsedConfigs = await Promise.all(
      projects
        .filter(root => {
          // Ignore globbed files that cannot be `require`d.
          if (
            typeof root === 'string' &&
            fs.existsSync(root) &&
            !fs.lstatSync(root).isDirectory() &&
            !constants.JEST_CONFIG_EXT_ORDER.some(ext => root.endsWith(ext))
          ) {
            return false;
          }

          return true;
        })
        .map((root, projectIndex) => {
          const projectIsTheOnlyProject =
            projectIndex === 0 && projects.length === 1;
          const skipArgvConfigOption = !(
            projectIsTheOnlyProject && projectIsCwd
          );

          return readConfig(
            argv,
            root,
            skipArgvConfigOption,
            configPath ? path.dirname(configPath) : cwd,
            projectIndex,
            // we wanna skip the warning if this is the "main" project
            projectIsCwd,
          );
        }),
    );

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

  if (!globalConfig || configs.length === 0) {
    throw new Error('jest: No configuration found for any project.');
  }

  return {
    configs,
    globalConfig,
    hasDeprecationWarnings: !!hasDeprecationWarnings,
  };
}
