/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Argv} from 'types/Argv';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';

import {getTestEnvironment, isJSONString} from './utils';
import normalize from './normalize';
import resolveConfigPath from './resolve_config_path';
import readConfigFileAndSetRootDir from './read_config_file_and_set_root_dir';

function readConfig(
  argv: Argv,
  packageRoot: string,
  // Whether it needs to look into `--config` arg passed to CLI.
  // It only used to read initial config. If the initial config contains
  // `project` property, we don't want to read `--config` value and rather
  // read individual configs for every project.
  skipArgvConfigOption?: boolean,
): {
  configPath: ?Path,
  globalConfig: GlobalConfig,
  hasDeprecationWarnings: boolean,
  projectConfig: ProjectConfig,
} {
  let rawOptions;
  let configPath;

  // A JSON string was passed to `--config` argument and we can parse it
  // and use as is.
  if (isJSONString(argv.config)) {
    let config;
    try {
      config = JSON.parse(argv.config);
    } catch (e) {
      throw new Error(
        'There was an error while parsing the `--config` argument as a JSON string.',
      );
    }

    // NOTE: we might need to resolve this dir to an absolute path in the future
    config.rootDir = config.rootDir || packageRoot;
    rawOptions = config;
    // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json` or `jest.conf.js`
  } else if (!skipArgvConfigOption && typeof argv.config == 'string') {
    configPath = resolveConfigPath(argv.config, process.cwd());
    rawOptions = readConfigFileAndSetRootDir(configPath);
  } else {
    // Otherwise just try to find config in the current rootDir.
    configPath = resolveConfigPath(packageRoot, process.cwd());
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
): {globalConfig: GlobalConfig, projectConfig: ProjectConfig} => {
  return {
    globalConfig: Object.freeze({
      bail: options.bail,
      changedFilesWithAncestor: options.changedFilesWithAncestor,
      collectCoverage: options.collectCoverage,
      collectCoverageFrom: options.collectCoverageFrom,
      collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
      coverageDirectory: options.coverageDirectory,
      coverageReporters: options.coverageReporters,
      coverageThreshold: options.coverageThreshold,
      expand: options.expand,
      failWithNoTests: options.failWithNoTests,
      findRelatedTests: options.findRelatedTests,
      forceExit: options.forceExit,
      json: options.json,
      lastCommit: options.lastCommit,
      listTests: options.listTests,
      logHeapUsage: options.logHeapUsage,
      mapCoverage: options.mapCoverage,
      maxWorkers: options.maxWorkers,
      noSCM: undefined,
      noStackTrace: options.noStackTrace,
      nonFlagArgs: options.nonFlagArgs,
      notify: options.notify,
      onlyChanged: options.onlyChanged,
      outputFile: options.outputFile,
      projects: options.projects,
      replname: options.replname,
      reporters: options.reporters,
      rootDir: options.rootDir,
      silent: options.silent,
      testFailureExitCode: options.testFailureExitCode,
      testNamePattern: options.testNamePattern,
      testPathPattern: options.testPathPattern,
      testResultsProcessor: options.testResultsProcessor,
      updateSnapshot: options.updateSnapshot,
      useStderr: options.useStderr,
      verbose: options.verbose,
      watch: options.watch,
      watchAll: options.watchAll,
      watchman: options.watchman,
    }),
    projectConfig: Object.freeze({
      automock: options.automock,
      browser: options.browser,
      cache: options.cache,
      cacheDirectory: options.cacheDirectory,
      clearMocks: options.clearMocks,
      coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
      displayName: options.displayName,
      globals: options.globals,
      haste: options.haste,
      moduleDirectories: options.moduleDirectories,
      moduleFileExtensions: options.moduleFileExtensions,
      moduleLoader: options.moduleLoader,
      moduleNameMapper: options.moduleNameMapper,
      modulePathIgnorePatterns: options.modulePathIgnorePatterns,
      modulePaths: options.modulePaths,
      name: options.name,
      resetMocks: options.resetMocks,
      resetModules: options.resetModules,
      resolver: options.resolver,
      rootDir: options.rootDir,
      roots: options.roots,
      runner: options.runner,
      setupFiles: options.setupFiles,
      setupTestFrameworkScriptFile: options.setupTestFrameworkScriptFile,
      skipNodeResolution: options.skipNodeResolution,
      snapshotSerializers: options.snapshotSerializers,
      testEnvironment: options.testEnvironment,
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
  };
};

module.exports = {
  getTestEnvironment,
  isJSONString,
  normalize,
  readConfig,
};
