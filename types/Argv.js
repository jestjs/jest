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

export type Argv = {|
  _: Array<string>,
  $0: string,
  automock: boolean,
  bail: boolean,
  browser: boolean,
  cache: boolean,
  cacheDirectory: string,
  clearMocks: boolean,
  ci: boolean,
  collectCoverage: boolean,
  collectCoverageFrom: Array<string>,
  collectCoverageOnlyFrom: Array<string>,
  config: string,
  coverage: boolean,
  coverageDirectory: string,
  coveragePathIgnorePatterns: Array<string>,
  coverageReporters: Array<string>,
  coverageThreshold: string,
  env: string,
  expand: boolean,
  findRelatedTests: boolean,
  forceExit: boolean,
  globals: string,
  h: boolean,
  haste: string,
  help: boolean,
  json: boolean,
  lastCommit: boolean,
  logHeapUsage: boolean,
  mapCoverage: boolean,
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
  onlyChanged: boolean,
  outputFile: string,
  preset: ?string,
  replname: ?string,
  resetMocks: boolean,
  resetModules: boolean,
  resolver: ?string,
  rootDir: string,
  roots: Array<string>,
  setupFiles: Array<string>,
  setupTestFrameworkScriptFile: string,
  silent: boolean,
  snapshotSerializers: Array<string>,
  testDescriptionPattern: string,
  testEnvironment: string,
  testMatch: Array<string>,
  testNamePattern: string,
  testPathIgnorePatterns: Array<string>,
  testPathPattern: string,
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
  watch: boolean,
  watchAll: boolean,
  watchman: boolean,
|};
