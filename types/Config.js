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

export type HasteConfig = {
  providesModuleNodeModules: Array<string>,
  defaultPlatform?: ?string,
  platforms?: Array<string>,
};

export type ConfigGlobals = Object;

type BaseConfig = {
  automock: boolean,
  bail: boolean,
  browser: boolean,
  cacheDirectory: Path,
  coveragePathIgnorePatterns: Array<string>,
  coverageReporters: Array<string>,
  globals: ConfigGlobals,
  haste: HasteConfig,
  mocksPattern: string,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  modulePathIgnorePatterns: Array<string>,
  noStackTrace: boolean,
  notify: boolean,
  preset: ?string,
  testEnvData: {},
  testEnvironment: string,
  testPathDirs: Array<Path>,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testURL: string,
  useStderr: boolean,
  verbose: boolean,
  watch: boolean,
};

export type DefaultConfig = BaseConfig & {
  moduleNameMapper: {},
};

export type Config = BaseConfig & {
  cache: boolean,
  collectCoverageFrom: Array<Glob>,
  collectCoverageOnlyFrom: {[key: string]: Path},
  colors: boolean,
  collectCoverage: boolean,
  coverageThreshold: {
    global: {
      [key: string]: number,
    },
  },
  moduleLoader: Path,
  moduleNameMapper: Array<string>,
  modulePaths: Array<string>,
  name: string,
  persistModuleRegistryBetweenSpecs: boolean,
  preprocessorIgnorePatterns: Array<string>,
  rootDir: Path,
  scriptPreprocessor: Path,
  setupTestFrameworkScriptFile: Path,
  setupFiles: Array<Path>,
  testcheckOptions: {},
  testFileExtensions: Array<string>,
  testDirectoryName: string,
  updateSnapshot: boolean,
  watchman: boolean,
};
