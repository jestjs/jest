/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Argv} from 'types/Argv';
import type {
  GlobalConfig,
  InitialOptions,
  Path,
  ProjectConfig,
} from 'types/Config';

import path from 'path';
import {isJSONString, replaceRootDirInPath} from './utils';
import normalize from './normalize';
import resolveConfigPath from './resolve_config_path';
import readConfigFileAndSetRootDir from './read_config_file_and_set_root_dir';

export {getTestEnvironment, isJSONString} from './utils';
export {default as normalize} from './normalize';
export {default as deprecationEntries} from './deprecated';
export {replaceRootDirInPath} from './utils';
export {default as defaults} from './defaults';
export {default as descriptions} from './descriptions';

export function readConfig(
  argv: Argv,
  packageRootOrConfig: Path | InitialOptions,
  // Whether it needs to look into `--config` arg passed to CLI.
  // It only used to read initial config. If the initial config contains
  // `project` property, we don't want to read `--config` value and rather
  // read individual configs for every project.
  skipArgvConfigOption?: boolean,
  parentConfigPath: ?Path,
): {
  configPath: ?Path,
  globalConfig: GlobalConfig,
  hasDeprecationWarnings: boolean,
  projectConfig: ProjectConfig,
} {
  let rawOptions;
  let configPath = null;

  if (typeof packageRootOrConfig !== 'string') {
    if (parentConfigPath) {
      const parentConfigDirname = path.dirname(parentConfigPath);
      rawOptions = packageRootOrConfig;
      rawOptions.rootDir = rawOptions.rootDir
        ? replaceRootDirInPath(parentConfigDirname, rawOptions.rootDir)
        : parentConfigDirname;
    } else {
      throw new Error(
        'Jest: Cannot use configuration as an object without a file path.',
      );
    }
  } else if (isJSONString(argv.config)) {
    // A JSON string was passed to `--config` argument and we can parse it
    // and use as is.
    let config;
    try {
      config = JSON.parse(argv.config);
    } catch (e) {
      throw new Error(
        'There was an error while parsing the `--config` argument as a JSON string.',
      );
    }

    // NOTE: we might need to resolve this dir to an absolute path in the future
    config.rootDir = config.rootDir || packageRootOrConfig;
    rawOptions = config;
    // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json` or `jest.config.js`
  } else if (!skipArgvConfigOption && typeof argv.config == 'string') {
    configPath = resolveConfigPath(argv.config, process.cwd());
    rawOptions = readConfigFileAndSetRootDir(configPath);
  } else {
    // Otherwise just try to find config in the current rootDir.
    configPath = resolveConfigPath(packageRootOrConfig, process.cwd());
    rawOptions = readConfigFileAndSetRootDir(configPath);
  }

  const {options, hasDeprecationWarnings} = normalize(rawOptions, argv);
  const {globalConfig, projectConfig} = getConfigs(options);
  return {
    configPath,
    globalConfig,
    hasDeprecationWarnings,
    projectConfig,
  };
}

const getConfigs = (
  options: Object,
): {globalConfig: GlobalConfig, projectConfig: ProjectConfig} => ({
  globalConfig: Object.freeze({
    bail: options.bail,
    changedFilesWithAncestor: options.changedFilesWithAncestor,
    changedSince: options.changedSince,
    collectCoverage: options.collectCoverage,
    collectCoverageFrom: options.collectCoverageFrom,
    collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
    coverageDirectory: options.coverageDirectory,
    coverageReporters: options.coverageReporters,
    coverageThreshold: options.coverageThreshold,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    enabledTestsMap: options.enabledTestsMap,
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
    maxWorkers: options.maxWorkers,
    noSCM: undefined,
    noStackTrace: options.noStackTrace,
    nonFlagArgs: options.nonFlagArgs,
    notify: options.notify,
    notifyMode: options.notifyMode,
    onlyChanged: options.onlyChanged,
    onlyFailures: options.onlyFailures,
    outputFile: options.outputFile,
    passWithNoTests: options.passWithNoTests,
    projects: options.projects,
    replname: options.replname,
    reporters: options.reporters,
    rootDir: options.rootDir,
    runTestsByPath: options.runTestsByPath,
    silent: options.silent,
    skipFilter: options.skipFilter,
    testFailureExitCode: options.testFailureExitCode,
    testNamePattern: options.testNamePattern,
    testPathPattern: options.testPathPattern,
    testResultsProcessor: options.testResultsProcessor,
    updateSnapshot: options.updateSnapshot,
    useStderr: options.useStderr,
    verbose: options.verbose,
    watch: options.watch,
    watchAll: options.watchAll,
    watchPlugins: options.watchPlugins,
    watchman: options.watchman,
  }),
  projectConfig: Object.freeze({
    automock: options.automock,
    browser: options.browser,
    cache: options.cache,
    cacheDirectory: options.cacheDirectory,
    clearMocks: options.clearMocks,
    coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
    cwd: options.cwd,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    displayName: options.displayName,
    errorOnDeprecated: options.errorOnDeprecated,
    filter: options.filter,
    forceCoverageMatch: options.forceCoverageMatch,
    globals: options.globals,
    haste: options.haste,
    moduleDirectories: options.moduleDirectories,
    moduleFileExtensions: options.moduleFileExtensions,
    moduleLoader: options.moduleLoader,
    moduleNameMapper: options.moduleNameMapper,
    modulePathIgnorePatterns: options.modulePathIgnorePatterns,
    modulePaths: options.modulePaths,
    name: options.name,
    prettierPath: options.prettierPath,
    resetMocks: options.resetMocks,
    resetModules: options.resetModules,
    resolver: options.resolver,
    restoreMocks: options.restoreMocks,
    rootDir: options.rootDir,
    roots: options.roots,
    runner: options.runner,
    setupFiles: options.setupFiles,
    setupTestFrameworkScriptFile: options.setupTestFrameworkScriptFile,
    skipFilter: options.skipFilter,
    skipNodeResolution: options.skipNodeResolution,
    snapshotSerializers: options.snapshotSerializers,
    testEnvironment: options.testEnvironment,
    testEnvironmentOptions: options.testEnvironmentOptions,
    testLocationInResults: options.testLocationInResults,
    testMatch: options.testMatch,
    testPathIgnorePatterns: options.testPathIgnorePatterns,
    testRegex: options.testRegex,
    testRunner: options.testRunner,
    testURL: options.testURL,
    timers: options.timers,
    transform: options.transform,
    transformIgnorePatterns: options.transformIgnorePatterns,
    unmockedModulePathPatterns: options.unmockedModulePathPatterns,
    watchPathIgnorePatterns: options.watchPathIgnorePatterns,
  }),
});
