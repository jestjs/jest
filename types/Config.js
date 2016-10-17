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

export type Path = string;
export type Glob = string;

export type HasteConfig = {|
  providesModuleNodeModules: Array<string>,
  defaultPlatform?: ?string,
  platforms?: Array<string>,
|};

export type ConfigGlobals = Object;

export type DefaultConfig = {|
  automock: boolean,
  bail: boolean,
  browser: boolean,
  cacheDirectory: Path,
  clearMocks: boolean,
  coveragePathIgnorePatterns: Array<string>,
  coverageReporters: Array<string>,
  globals: ConfigGlobals,
  haste: HasteConfig,
  mocksPattern: string,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleNameMapper: {},
  modulePathIgnorePatterns: Array<string>,
  noStackTrace: boolean,
  notify: boolean,
  preprocessorIgnorePatterns: Array<string>,
  preset: ?string,
  resetModules: boolean,
  testEnvironment: string,
  testPathDirs: Array<Path>,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testURL: string,
  timers: 'real' | 'fake',
  useStderr: boolean,
  verbose: ?boolean,
  watch: boolean,
|};

export type Config = DefaultConfig & {|
  cache: boolean,
  collectCoverageFrom: Array<Glob>,
  collectCoverageOnlyFrom: {[key: string]: Path},
  collectCoverage: boolean,
  coverageDirectory: string,
  coverageThreshold: {
    global: {
      [key: string]: number,
    },
  },
  logHeapUsage: boolean,
  moduleLoader: Path,
  moduleNameMapper: Array<string>,
  modulePaths: Array<string>,
  name: string,
  rootDir: Path,
  scriptPreprocessor: Path,
  setupFiles: Array<Path>,
  setupTestFrameworkScriptFile: Path,
  silent: boolean,
  testcheckOptions: {},
  testNamePattern: string,
  unmockedModulePathPatterns: Array<string>,
  updateSnapshot: boolean,
  usesBabelJest: boolean,
  watchman: boolean,
  forceExit: boolean,
|};
