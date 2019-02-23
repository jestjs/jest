/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Arguments} from 'yargs';

export type Argv = Arguments<{
  all: boolean;
  automock: boolean;
  bail: boolean | number;
  browser: boolean;
  cache: boolean;
  cacheDirectory: string;
  changedFilesWithAncestor: boolean;
  changedSince: string;
  ci: boolean;
  clearCache: boolean;
  clearMocks: boolean;
  collectCoverage: boolean;
  collectCoverageFrom: Array<string>;
  collectCoverageOnlyFrom: Array<string>;
  config: string;
  coverage: boolean;
  coverageDirectory: string;
  coveragePathIgnorePatterns: Array<string>;
  coverageReporters: Array<string>;
  coverageThreshold: string;
  debug: boolean;
  env: string;
  expand: boolean;
  findRelatedTests: boolean;
  forceExit: boolean;
  globals: string;
  globalSetup: string | null | undefined;
  globalTeardown: string | null | undefined;
  h: boolean;
  haste: string;
  help: boolean;
  init: boolean;
  json: boolean;
  lastCommit: boolean;
  logHeapUsage: boolean;
  maxWorkers: number;
  moduleDirectories: Array<string>;
  moduleFileExtensions: Array<string>;
  moduleLoader: string;
  moduleNameMapper: string;
  modulePathIgnorePatterns: Array<string>;
  modulePaths: Array<string>;
  name: string;
  noSCM: boolean;
  noStackTrace: boolean;
  notify: boolean;
  notifyMode: string;
  onlyChanged: boolean;
  outputFile: string;
  preset: string | null | undefined;
  projects: Array<string>;
  prettierPath: string | null | undefined;
  replname: string | null | undefined;
  resetMocks: boolean;
  resetModules: boolean;
  resolver: string | null | undefined;
  restoreMocks: boolean;
  rootDir: string;
  roots: Array<string>;
  runInBand: boolean;
  setupFiles: Array<string>;
  setupFilesAfterEnv: Array<string>;
  showConfig: boolean;
  silent: boolean;
  snapshotSerializers: Array<string>;
  testEnvironment: string;
  testFailureExitCode: string | null | undefined;
  testMatch: Array<string>;
  testNamePattern: string;
  testPathIgnorePatterns: Array<string>;
  testPathPattern: Array<string>;
  testRegex: string | Array<string>;
  testResultsProcessor: string | null | undefined;
  testRunner: string;
  testURL: string;
  timers: 'real' | 'fake';
  transform: string;
  transformIgnorePatterns: Array<string>;
  unmockedModulePathPatterns: Array<string> | null | undefined;
  updateSnapshot: boolean;
  useStderr: boolean;
  verbose: boolean | null | undefined;
  version: boolean;
  watch: boolean;
  watchAll: boolean;
  watchman: boolean;
  watchPathIgnorePatterns: Array<string>;
}>;
