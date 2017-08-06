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

import type {GlobalConfig, ProjectConfig} from 'types/Config';

const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  bail: false,
  changedFilesWithAncestor: false,
  collectCoverage: false,
  collectCoverageFrom: [],
  collectCoverageOnlyFrom: null,
  coverageDirectory: 'coverage',
  coverageReporters: [],
  coverageThreshold: {global: {}},
  expand: false,
  findRelatedTests: false,
  forceExit: false,
  json: false,
  lastCommit: false,
  listTests: false,
  logHeapUsage: false,
  mapCoverage: false,
  maxWorkers: 2,
  noSCM: null,
  noStackTrace: false,
  nonFlagArgs: [],
  notify: false,
  onlyChanged: false,
  outputFile: null,
  projects: [],
  replname: null,
  reporters: [],
  rootDir: '/test_root_dir/',
  silent: false,
  testFailureExitCode: 1,
  testNamePattern: '',
  testPathPattern: '',
  testResultsProcessor: null,
  updateSnapshot: 'none',
  useStderr: false,
  verbose: false,
  watch: false,
  watchAll: false,
  watchman: false,
};

const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  automock: false,
  browser: false,
  cache: false,
  cacheDirectory: '/test_cache_dir/',
  clearMocks: false,
  coveragePathIgnorePatterns: [],
  cwd: '/test_root_dir/',
  displayName: undefined,
  globals: {},
  haste: {
    providesModuleNodeModules: [],
  },
  moduleDirectories: [],
  moduleFileExtensions: ['js'],
  moduleLoader: '/test_module_loader_path',
  moduleNameMapper: [],
  modulePathIgnorePatterns: [],
  modulePaths: [],
  name: 'test_name',
  resetMocks: false,
  resetModules: false,
  resolver: null,
  rootDir: '/test_root_dir/',
  roots: [],
  runner: 'jest-runner',
  setupFiles: [],
  setupTestFrameworkScriptFile: null,
  skipNodeResolution: false,
  snapshotSerializers: [],
  testEnvironment: 'node',
  testMatch: [],
  testPathIgnorePatterns: [],
  testRegex: '.test.js$',
  testRunner: 'jest-jasmine2',
  testURL: '',
  timers: 'real',
  transform: [],
  transformIgnorePatterns: [],
  unmockedModulePathPatterns: null,
  watchPathIgnorePatterns: [],
};

const makeGlobalConfig = (overrides: Object = {}): GlobalConfig => {
  const overridesKeys = new Set(Object.keys(overrides));
  Object.keys(DEFAULT_GLOBAL_CONFIG).forEach(key => overridesKeys.delete(key));

  if (overridesKeys.size > 0) {
    throw new Error(`
      Properties that are not part of GlobalConfig type were passed:
      ${JSON.stringify(Array.from(overridesKeys))}
    `);
  }

  return Object.assign({}, DEFAULT_GLOBAL_CONFIG, overrides);
};

const makeProjectConfig = (overrides: Object = {}): ProjectConfig => {
  const overridesKeys = new Set(Object.keys(overrides));
  Object.keys(DEFAULT_PROJECT_CONFIG).forEach(key => overridesKeys.delete(key));

  if (overridesKeys.size > 0) {
    throw new Error(`
      Properties that are not part of ProjectConfig type were passed:
      ${JSON.stringify(Array.from(overridesKeys))}
    `);
  }

  return Object.assign({}, DEFAULT_PROJECT_CONFIG, overrides);
};

module.exports = {
  makeGlobalConfig,
  makeProjectConfig,
};
