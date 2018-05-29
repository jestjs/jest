/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

export type Argv = {|
  _: Array<string>,
  $0: string,
  all: boolean,
  automock: boolean,
  bail: boolean,
  browser: boolean,
  cache: boolean,
  cacheDirectory: string,
  changedFilesWithAncestor: boolean,
  changedSince: string,
  ci: boolean,
  clearCache: boolean,
  clearMocks: boolean,
  collectCoverage: boolean,
  collectCoverageFrom: Array<string>,
  collectCoverageOnlyFrom: Array<string>,
  config: string,
  coverage: boolean,
  coverageDirectory: string,
  coveragePathIgnorePatterns: Array<string>,
  coverageReporters: Array<string>,
  coverageThreshold: string,
  debug: boolean,
  env: string,
  expand: boolean,
  findRelatedTests: boolean,
  forceExit: boolean,
  globals: string,
  globalSetup: ?string,
  globalTeardown: ?string,
  h: boolean,
  haste: string,
  help: boolean,
  json: boolean,
  lastCommit: boolean,
  logHeapUsage: boolean,
  maxWorkers: number,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleLoader: string,
  moduleNameMapper: string,
  modulePathIgnorePatterns: Array<string>,
  modulePaths: Array<string>,
  name: string,
  noSCM: boolean,
  noStackTrace: boolean,
  notify: boolean,
  notifyMode: string,
  onlyChanged: boolean,
  outputFile: string,
  preset: ?string,
  projects: Array<string>,
  replname: ?string,
  resetMocks: boolean,
  resetModules: boolean,
  resolver: ?string,
  restoreMocks: boolean,
  rootDir: string,
  roots: Array<string>,
  runInBand: boolean,
  setupFiles: Array<string>,
  setupTestFrameworkScriptFile: string,
  showConfig: boolean,
  silent: boolean,
  snapshotSerializers: Array<string>,
  snapshotTag?: ?string,
  testEnvironment: string,
  testFailureExitCode: ?string,
  testMatch: Array<string>,
  testNamePattern: string,
  testPathIgnorePatterns: Array<string>,
  testPathPattern: Array<string>,
  testRegex: string,
  testResultsProcessor: ?string,
  testRunner: string,
  testURL: string,
  timers: 'real' | 'fake',
  transform: string,
  transformIgnorePatterns: Array<string>,
  unmockedModulePathPatterns: ?Array<string>,
  updateSnapshot: boolean,
  useStderr: boolean,
  verbose: ?boolean,
  version: boolean,
  watch: boolean,
  watchAll: boolean,
  watchman: boolean,
  watchPathIgnorePatterns: Array<string>,
|};
