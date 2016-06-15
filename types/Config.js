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

export type HasteConfig = {
  providesModuleNodeModules: Array<string>,
  defaultPlatform?: ?string,
  platforms?: Array<string>,
};

export type ConfigGlobals = Object;

export type Config = {
  automock: boolean,
  bail: boolean,
  cache?: boolean,
  cacheDirectory: Path,
  colors: boolean,
  coverageCollector: Path,
  coverageReporters: Array<string>,
  coverageThreshold?: {
    global: {
      [key: string]: number,
    },
  },
  collectCoverage?: boolean,
  globals: ConfigGlobals,
  haste: HasteConfig,
  logHeapUsage?: boolean,
  mocksPattern: string,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleLoader: Path,
  moduleNameMapper: Object,
  modulePathIgnorePatterns: Array<string>,
  modulePaths?: Array<string>,
  name?: string,
  noHighlight: boolean,
  noStackTrace: boolean,
  persistModuleRegistryBetweenSpecs?: boolean,
  preprocessorIgnorePatterns?: Array<string>,
  rootDir?: Path,
  scriptPreprocessor?: string | Object,
  setupFiles?: Array<string>,
  setupTestFrameworkScriptFile?: Path,
  setupEnvScriptFile?: ?string,
  silent?: boolean,
  testcheckOptions?: {},
  testEnvData: {},
  testEnvironment: string,
  testDirectoryName?: string,
  testFileExtensions?: Array<string>,
  testPathDirs: Array<Path>,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testReporter: Path,
  testRunner?: string,
  testURL: string,
  updateSnapshot?: {},
  usesBabelJest?: boolean,
  useStderr: boolean,
  verbose: boolean,
  watchman?: boolean,
};
