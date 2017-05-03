/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Argv} from 'types/Argv';
import type {GlobalConfig, ProjectConfig} from 'types/Config';

const {getTestEnvironment, isJSONString} = require('./utils');
const findConfig = require('./findConfig');
const loadFromFile = require('./loadFromFile');
const normalize = require('./normalize');
const path = require('path');

function readConfig(
  argv: Argv,
  packageRoot: string,
): {
  config: ProjectConfig,
  globalConfig: GlobalConfig,
  hasDeprecationWarnings: boolean,
} {
  const rawOptions = readOptions(argv, packageRoot);
  const {options, hasDeprecationWarnings} = normalize(rawOptions, argv);
  const {globalConfig, projectConfig} = getConfigs(options);
  return {
    config: projectConfig,
    globalConfig,
    hasDeprecationWarnings,
  };
}

const parseConfig = argv =>
  isJSONString(argv.config) ? JSON.parse(argv.config) : argv.config;

const readOptions = (argv, root) => {
  const rawOptions = parseConfig(argv);

  if (typeof rawOptions === 'string') {
    return loadFromFile(path.resolve(process.cwd(), rawOptions));
  }

  if (typeof rawOptions === 'object') {
    const config = Object.assign({}, rawOptions);
    config.rootDir = config.rootDir || root;
    return config;
  }

  return findConfig(root);
};

const getConfigs = (
  options: Object,
): {globalConfig: GlobalConfig, projectConfig: ProjectConfig} => {
  return {
    globalConfig: Object.freeze({
      bail: options.bail,
      collectCoverage: options.collectCoverage,
      collectCoverageFrom: options.collectCoverageFrom,
      collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
      coverageDirectory: options.coverageDirectory,
      coverageReporters: options.coverageReporters,
      coverageThreshold: options.coverageThreshold,
      expand: options.expand,
      forceExit: options.forceExit,
      logHeapUsage: options.logHeapUsage,
      mapCoverage: options.mapCoverage,
      noStackTrace: options.noStackTrace,
      notify: options.notify,
      projects: options.projects,
      replname: options.replname,
      reporters: options.reporters,
      rootDir: options.rootDir,
      silent: options.silent,
      testNamePattern: options.testNamePattern,
      testPathPattern: '',
      testResultsProcessor: options.testResultsProcessor,
      updateSnapshot: options.updateSnapshot,
      useStderr: options.useStderr,
      verbose: options.verbose,
      watch: options.watch,
      watchman: options.watchman,
    }),
    projectConfig: Object.freeze({
      automock: options.automock,
      browser: options.browser,
      cache: options.cache,
      cacheDirectory: options.cacheDirectory,
      clearMocks: options.clearMocks,
      coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
      globals: options.globals,
      haste: options.haste,
      moduleDirectories: options.moduleDirectories,
      moduleFileExtensions: options.moduleFileExtensions,
      moduleLoader: options.moduleLoader,
      moduleNameMapper: options.moduleNameMapper,
      modulePathIgnorePatterns: options.modulePathIgnorePatterns,
      modulePaths: options.modulePaths,
      name: options.name,
      preset: options.preset,
      resetMocks: options.resetMocks,
      resetModules: options.resetModules,
      resolver: options.resolver,
      rootDir: options.rootDir,
      roots: options.roots,
      setupFiles: options.setupFiles,
      setupTestFrameworkScriptFile: options.setupTestFrameworkScriptFile,
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
    }),
  };
};

module.exports = {
  getTestEnvironment,
  normalize,
  readConfig,
};
